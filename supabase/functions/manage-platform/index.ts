import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ADMIN_ADDRESS = 'askguy';

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
    
    if (!callerAddress) throw new Error("Missing caller address for verification.");

    const normalizedCaller = callerAddress.toLowerCase().trim();
    const isAdmin = normalizedCaller === ADMIN_ADDRESS;

    console.log(`[manage-platform] Action: ${action} | Caller: ${normalizedCaller} | IsAdmin: ${isAdmin}`);

    // --- 1. REQUEST MANAGEMENT ---
    
    if (action === 'CREATE_REQUEST') {
      const { data, error } = await supabaseClient
        .from('aid_requests')
        .insert({
          ...payload,
          requestor: normalizedCaller, // Force requestor to be the authenticated caller
          timestamp: Date.now(),
          status: 'Open',
          raised: 0
        })
        .select()
      if (error) throw error
      return new Response(JSON.stringify(data[0]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'UPDATE_REQUEST') {
      // Security Check: Only the owner or admin can update
      const { data: existing } = await supabaseClient.from('aid_requests').select('requestor').eq('id', payload.id).single();
      if (!existing || (existing.requestor.toLowerCase() !== normalizedCaller && !isAdmin)) {
        throw new Error("Unauthorized: You do not own this request.");
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
      // Security Check: Only admin can delete others' posts
      if (!isAdmin) throw new Error("Unauthorized: Admin privileges required to delete.");
      
      await supabaseClient.from('contributions').delete().eq('request_id', payload.id);
      const { error } = await supabaseClient.from('aid_requests').delete().eq('id', payload.id);
      if (error) throw error
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // --- 2. CONTRIBUTIONS ---

    if (action === 'ADD_CONTRIBUTION') {
      const { data, error } = await supabaseClient
        .from('contributions')
        .insert({
          ...payload,
          user: normalizedCaller, // Force user to be the authenticated caller
          timestamp: Date.now()
        })
        .select()
      if (error) throw error
      return new Response(JSON.stringify(data[0]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // --- 3. PROFILE MANAGEMENT ---

    if (action === 'UPSERT_PROFILE') {
      // Security Check: Users can only update their own profile
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

    // --- 4. ADMIN ONLY ACTIONS ---

    if (!isAdmin && ['UPDATE_SETTINGS', 'BAN_USER', 'UNBAN_USER'].includes(action)) {
      throw new Error("Unauthorized: Restricted to platform administrators.");
    }

    if (action === 'UPDATE_SETTINGS') {
      const { data, error } = await supabaseClient
        .from('site_settings')
        .update(payload)
        .eq('id', 'global')
        .select()
      if (error) throw error
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