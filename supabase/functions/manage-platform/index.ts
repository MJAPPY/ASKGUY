import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  console.log("[manage-platform] Received request");

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, payload } = await req.json()

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

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: corsHeaders })

  } catch (error) {
    console.error("[manage-platform] Error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }
})