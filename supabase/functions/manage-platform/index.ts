import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-secret',
}

const ADMIN_ADDRESS = 'askguy';
const MAX_PROOF_LENGTH = 10 * 1024 * 1024; // 10MB limit

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration environment variables.");
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const { action, payload, callerAddress } = await req.json();
    
    if (payload?.proof_url && payload.proof_url.length > MAX_PROOF_LENGTH) {
      throw new Error("Payload too large: Image verification proof exceeds maximum size limit.");
    }

    const normalizedCaller = callerAddress ? callerAddress.toLowerCase().trim() : 'anonymous';
    const isAdmin = normalizedCaller === ADMIN_ADDRESS;
    const clientAdminSecret = req.headers.get('x-admin-secret') || '';

    // --- PUBLIC ACTIONS ---
    if (action === 'INCREMENT_LIKES') {
      const { data: current, error: fetchErr } = await supabaseClient
        .from('site_settings')
        .select('leaderboard_likes')
        .eq('id', 'global')
        .maybeSingle();
      
      if (fetchErr) throw fetchErr;
      
      const newCount = (current?.leaderboard_likes || 0) + 1;
      const { data, error: updateErr } = await supabaseClient
        .from('site_settings')
        .update({ leaderboard_likes: newCount })
        .eq('id', 'global')
        .select();
      
      if (updateErr) throw updateErr;
      return new Response(JSON.stringify(data[0]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!callerAddress) {
      throw new Error("Missing caller address for protected actions.");
    }

    // --- PROTECTED ACTIONS ---
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
        .select();
      if (error) throw error;
      return new Response(JSON.stringify(data[0]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'UPSERT_PROFILE') {
      if (payload.address?.toLowerCase() !== normalizedCaller) {
        throw new Error("Unauthorized: Identity mismatch.");
      }
      const { data, error } = await supabaseClient
        .from('profiles')
        .upsert(payload, { onConflict: 'address' })
        .select();
      if (error) throw error;
      return new Response(JSON.stringify(data[0]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'ADD_CONTRIBUTION') {
      const { data, error } = await supabaseClient
        .from('contributions')
        .insert({
          ...payload,
          user: normalizedCaller,
          timestamp: Date.now()
        })
        .select();
      if (error) throw error;
      return new Response(JSON.stringify(data[0]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // --- SECURED ADMIN CONFIGURATION & AUTH ---
    const { data: secretData, error: secretErr } = await supabaseClient
      .from('admin_secrets')
      .select('password_hash')
      .eq('id', 'global')
      .maybeSingle();

    if (secretErr) throw secretErr;
    const isPasswordConfigured = !!secretData?.password_hash;

    if (action === 'INITIALIZE_ADMIN_PASSWORD') {
      if (!isAdmin) {
        throw new Error("Unauthorized: Password initialization must come from @askguy wallet.");
      }
      if (isPasswordConfigured) {
        throw new Error("Admin Password has already been initialized.");
      }
      if (!payload.password || payload.password.length < 6) {
        throw new Error("Password must be at least 6 characters.");
      }

      const hashed = await hashPassword(payload.password);
      const { data, error } = await supabaseClient
        .from('admin_secrets')
        .insert({ id: 'global', password_hash: hashed })
        .select();

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Strict authentication check for other actions
    if (['UPDATE_SETTINGS', 'BAN_USER', 'UNBAN_USER', 'DELETE_REQUEST', 'UPDATE_REQUEST_ADMIN'].includes(action) || (action === 'UPDATE_REQUEST' && normalizedCaller !== ADMIN_ADDRESS)) {
      if (!isAdmin) {
        throw new Error("Unauthorized: Admin permissions required.");
      }
      if (!isPasswordConfigured) {
        throw new Error("Security Lock: Admin Password has not been initialized yet.");
      }
      if (!clientAdminSecret) {
        throw new Error("Unauthorized: Please provide your Admin Secret to execute this action.");
      }

      const clientHash = await hashPassword(clientAdminSecret);
      if (clientHash !== secretData.password_hash) {
        throw new Error("Unauthorized: Invalid Admin Secret key.");
      }
    }

    if (action === 'UPDATE_REQUEST') {
      const { data, error } = await supabaseClient
        .from('aid_requests')
        .update(payload.updates)
        .eq('id', payload.id)
        .select();
      if (error) throw error;
      return new Response(JSON.stringify(data[0]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'DELETE_REQUEST') {
      await supabaseClient.from('contributions').delete().eq('request_id', payload.id);
      const { error } = await supabaseClient.from('aid_requests').delete().eq('id', payload.id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'UPDATE_SETTINGS') {
      const { data, error } = await supabaseClient
        .from('site_settings')
        .update({
          membership_active: payload.membership_active,
          membership_fee: payload.membership_fee,
          posting_fee_guy: payload.posting_fee_guy,
          avatar_set: payload.avatar_set,
          maintenance_mode: payload.maintenance_mode,
          maintenance_message: payload.maintenance_message
        })
        .eq('id', 'global')
        .select();
      
      if (error) throw error;
      return new Response(JSON.stringify(data[0]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'BAN_USER') {
      const { data, error } = await supabaseClient
        .from('banned_users')
        .insert({ address: payload.address.toLowerCase().trim() })
        .select();
      if (error) throw error;
      return new Response(JSON.stringify(data[0]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'UNBAN_USER') {
      const { error } = await supabaseClient
        .from('banned_users')
        .delete()
        .eq('address', payload.address.toLowerCase().trim());
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: corsHeaders });

  } catch (error) {
    console.error("[manage-platform] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
})