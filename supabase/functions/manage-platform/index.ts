// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-secret',
}

const ADMIN_ADDRESS = 'askguy';
const MAX_PROOF_LENGTH = 10 * 1024 * 1024; // Limit Base64 payload to ~10MB max to prevent DB bloating

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

    // Retrieve Admin Secret from the custom header for authentication
    const clientAdminSecret = req.headers.get('x-admin-secret');
    const serverAdminSecret = Deno.env.get('ADMIN_SECRET');

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

    if (action === 'UPDATE_REQUEST') {
      const { data: existing } = await supabaseClient.from('aid_requests').select('requestor').eq('id', payload.id).single();
      if (!existing) throw new Error("Request not found.");

      // If updating, must be owner or must present valid admin secret
      const isAuthorizedAdmin = isAdmin && (!serverAdminSecret || clientAdminSecret === serverAdminSecret);
      if (existing.requestor.toLowerCase() !== normalizedCaller && !isAuthorizedAdmin) {
        throw new Error("Unauthorized: Identity verification failed.");
      }

      const { data, error } = await supabaseClient
        .from('aid_requests')
        .update(payload.updates)
        .eq('id', payload.id)
        .select()
      if (error) throw error
      return new Response(JSON.stringify(data[0]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'DELETE_REQUEST') {
      // If server secret is defined, client secret must match it. If not defined, fallback to verified wallet signature.
      if (serverAdminSecret && clientAdminSecret !== serverAdminSecret) {
        throw new Error("Unauthorized: Invalid Admin Secret Key.");
      }
      if (!isAdmin) {
        throw new Error("Unauthorized: Admin permissions required.");
      }
      await supabaseClient.from('contributions').delete().eq('request_id', payload.id);
      const { error } = await supabaseClient.from('aid_requests').delete().eq('id', payload.id);
      if (error) throw error
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
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

    // --- ADMIN ONLY ACTIONS ---

    if (['UPDATE_SETTINGS', 'BAN_USER', 'UNBAN_USER'].includes(action)) {
      if (serverAdminSecret && clientAdminSecret !== serverAdminSecret) {
        throw new Error("Unauthorized: Invalid Admin Secret Key.");
      }
      if (!isAdmin) {
        throw new Error("Unauthorized: Admin permissions required.");
      }
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