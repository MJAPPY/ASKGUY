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
    console.log(`[manage-platform] Action: ${action} from ${callerAddress}`);

    // Helper: Verify if the caller is the admin
    const isAdmin = callerAddress?.toLowerCase() === ADMIN_ADDRESS;

    // 1. CREATE REQUEST
    if (action === 'CREATE_REQUEST') {
      const { data, error } = await supabaseClient
        .from('aid_requests')
        .insert({
          ...payload,
          timestamp: Date.now(),
          status: 'Open',
          raised: 0
        })
        .select()
      if (error) throw error
      return new Response(JSON.stringify(data[0]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 2. ADD CONTRIBUTION
    if (action === 'ADD_CONTRIBUTION') {
      const { data, error } = await supabaseClient
        .from('contributions')
        .insert({
          ...payload,
          timestamp: Date.now()
        })
        .select()
      if (error) throw error
      return new Response(JSON.stringify(data[0]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 3. UPDATE PROFILE (Ensure users only edit themselves)
    if (action === 'UPSERT_PROFILE') {
      if (payload.address?.toLowerCase() !== callerAddress?.toLowerCase()) {
        throw new Error("Unauthorized: You can only update your own profile.");
      }
      const { data, error } = await supabaseClient
        .from('profiles')
        .upsert(payload, { onConflict: 'address' })
        .select()
      if (error) throw error
      return new Response(JSON.stringify(data[0]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // --- ADMIN ONLY ACTIONS ---
    
    if (!isAdmin && ['UPDATE_SETTINGS', 'BAN_USER', 'UNBAN_USER'].includes(action)) {
      throw new Error("Unauthorized: Admin privileges required.");
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
    console.error("[manage-platform] Error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }
})