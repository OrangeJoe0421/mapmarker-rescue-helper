
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    })
  }

  try {
    console.log("Edge function called: get-emergency-services")
    
    const url = new URL(req.url)
    const lat = url.searchParams.get('lat')
    const lon = url.searchParams.get('lon')

    console.log(`Received parameters: lat=${lat}, lon=${lon}`)

    if (!lat || !lon) {
      return new Response(
        JSON.stringify({ error: 'Latitude and longitude are required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Create a Supabase client with the service role key, which bypasses RLS
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    
    console.log("Querying emergency_services table...")
    
    // Query emergency services data
    const { data, error } = await supabase
      .from('emergency_services')
      .select('*')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)

    if (error) {
      console.error('Database query error:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    console.log(`Found ${data?.length || 0} emergency services`)
    
    // Return the data
    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Edge function error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
