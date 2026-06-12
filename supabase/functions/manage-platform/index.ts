// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-secret',
}

const ADMIN_ADDRESS = 'askguy';
const MAX_PROOF_LENGTH = 10 * 1024 * 1024; // Limit Base64 payload to ~10MB max to prevent DB bloating

// Cryptographically hash strings using SHA-256
async function hashPassword(password: string): Promise<string> {
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(password)
  );
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, payload, callerAddress } = await req.json()
    
    // Validate payload size for proof images
    if (payload?.proof_url && payload.proof_url.length > MAX_PROOF_LENGTH) {
      throw new Error("Payload too large: Image verification proof exceeds maximum size limit.");
    }

    const normalizedCaller = callerAddress ? callerAddress.toLowerCase().trim() : 'anonymous';
    const isAdmin = normalizedCaller === ADMIN_ADDRESS;

    // Retrieve Admin Secret from custom header
    const clientAdminSecret = req.headers.get('x-admin-secret');

    console.log(`[manage-platform] Action: ${action} | Caller: ${normalizedCaller} | IsAdmin: ${isAdmin}`);

    // --- PUBLIC ACTIONS (No Admin Check) ---

    if (action === 'INCREMENT_LIKES') {
      const { data: current } = await supabaseClient
        .from('site_settings')
        .select('leaderboard_likes')
        .eq('id', 'global')
        .maybeSingle();
      
      const newCount = (current?.leaderboard_likes || 0) + 1;
      
      const { data, error } = await supabaseClient
        .from('site_settings')
        .update({ leaderboard_likes: newCount })
        .eq('id', 'global')
        .select()
      
      if (error) throw error
      if (!data || data.length === 0) {
        throw new Error("No settings record found with ID 'global'.");
      }
      return new Response(JSON.stringify(data[0]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (!callerAddress) throw new Error("Missing caller address for protected actions.");

    // --- PROTECTED REQUEST MANAGEMENT ---
    
    if (action === 'CREATE_REQUEST') {
      const { data, error } = await supabaseClient
        .from('aid_requests')
        .insert({
          ...payload,
          requestor: normalizedCaller,
          timestamp: Date.now(),
          status: 'Open',
          raised: 0
        })
        .select()
      if (error) throw error
      return new Response(JSON.stringify(data[0]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'UPSERT_PROFILE') {
      if (payload.address?.toLowerCase() !== normalizedCaller) {
        throw new Error("Unauthorized: Identity mismatch.");
      }
      const { data, error } = await supabaseClient
        .from('profiles')
        .upsert(payload, { onConflict: 'address' })
        .select()
      if (error) throw error
      return new Response(JSON.stringify(data[0]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'ADD_CONTRIBUTION') {
      const { data, error } = await supabaseClient
        .from('contributions')
        .insert({
          ...payload,
          user: normalizedCaller,
          timestamp: Date.now()
        })
        .select()
      if (error) throw error
      return new Response(JSON.stringify(data[0]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // --- ADMINISTRATIVE AUTHENTICATION BOILERPLATE ---

    // Fetch master password hash
    const { data: secretData } = await supabaseClient
      .from('admin_secrets')
      .select('password_hash')
      .eq('id', 'global')
      .maybeSingle();

    const isPasswordConfigured = !!secretData?.password_hash;

    // First use configuration action
    if (action === 'INITIALIZE_ADMIN_PASSWORD') {
      if (!isAdmin) throw new Error("Unauthorized: First password initialization must come from @askguy wallet.");
      if (isPasswordConfigured) throw new Error("Admin Password has already been initialized.");
      if (!payload.password || payload.password.length < 6) throw new Error("Password must be at least 6 characters.");

      const hashed = await hashPassword(payload.password);
      const { data, error } = await supabaseClient
        .from('admin_secrets')
        .insert({ id: 'global', password_hash: hashed })
        .select();

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Protect all other admin actions
    if (['UPDATE_SETTINGS', 'BAN_USER', 'UNBAN_USER', 'DELETE_REQUEST', 'UPDATE_REQUEST_ADMIN'].includes(action) || (action === 'UPDATE_REQUEST' && normalizedCaller !== ADMIN_ADDRESS)) {
      if (!isAdmin) {
        throw new Error("Unauthorized: Admin permissions required.");
      }
      if (!isPasswordConfigured) {
        throw new Error("Security Lock: Admin Password has not been initialized yet. Set a password first.");
      }
      if (!clientAdminSecret) {
        throw new Error("Unauthorized: Please enter your Admin Secret to authenticate.");
      }

      // Verify Password Hash
      const clientHash = await hashPassword(clientAdminSecret);
      if (clientHash !== secretData.password_hash) {
        throw new Error("Unauthorized: Invalid Admin Secret key.");
      }
    }

    if (action === 'UPDATE_REQUEST') {
      const { data: existing } = await supabaseClient.from('aid_requests').select('requestor').eq('id', payload.id).single();
      if (!existing) throw new Error("Request not found.");

      const { data, error } = await supabaseClient
        .from('aid_requests')
        .update(payload.updates)
        .eq('id', payload.id)
        .select()
      if (error) throw error
      return new Response(JSON.stringify(data[0]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'DELETE_REQUEST') {
      await supabaseClient.from('contributions').delete().eq('request_id', payload.id);
      const { error } = await supabaseClient.from('aid_requests').delete().eq('id', payload.id);
      if (error) throw error
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'UPDATE_SETTINGS') {
      const { 
        membership_active, 
        membership_fee, 
        posting_fee_guy, 
        avatar_set, 
        maintenance_mode, 
        maintenance_message 
      } = payload;

      const { data, error } = await supabaseClient
        .from('site_settings')
        .update({
          membership_active,
          membership_fee,
          posting_fee_guy,
          avatar_set,
          maintenance_mode,
          maintenance_message
        })
        .eq('id', 'global')
        .select()
      
      if (error) throw error
      
      if (!data || data.length === 0) {
        throw new Error("No settings record found with ID 'global' in site_settings table.");
      }
      
      return new Response(JSON.stringify(data[0]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'BAN_USER') {
      const { data, error } = await supabaseClient
        .from('banned_users')
        .insert({ address: payload.address.toLowerCase().trim() })
        .select()
      if (error) throw error
      return new Response(JSON.stringify(data[0]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'UNBAN_USER') {
      const { error } = await supabaseClient
        .from('banned_users')
        .delete()
        .eq('address', payload.address.toLowerCase().trim())
      if (error) throw error
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: corsHeaders })

  } catch (error) {
    console.error("[manage-platform] Critical Error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }
})