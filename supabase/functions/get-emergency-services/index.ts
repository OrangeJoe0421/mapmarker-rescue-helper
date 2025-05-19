
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

console.log('Edge function loaded: get-emergency-services')

Deno.serve(async (req) => {
  console.log('Request received to get-emergency-services')
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request for CORS preflight')
    return new Response(null, {
      headers: corsHeaders,
      status: 204
    })
  }

  try {
    console.log("Edge function called: get-emergency-services")
    
    const url = new URL(req.url)
    const lat = url.searchParams.get('lat')
    const lon = url.searchParams.get('lon')
    const radiusKm = url.searchParams.get('radius') || '30'
    const types = url.searchParams.get('types')

    console.log(`Received parameters: lat=${lat}, lon=${lon}, radius=${radiusKm}km, types=${types || 'all'}`)

    if (!lat || !lon) {
      console.log('Missing lat or lon parameters')
      return new Response(
        JSON.stringify({ error: 'Latitude and longitude are required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Create a Supabase client with the service role key, which bypasses RLS
    console.log('Creating Supabase client with service role key')
    console.log(`Using Supabase URL: ${supabaseUrl.substring(0, 12)}...`)
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    
    console.log("Querying emergency_services table with spatial filtering...")
    
    // Build the query with spatial filtering using raw SQL
    let query = supabase.from('emergency_services').select('*')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);
      
    // Apply type filtering if specified
    if (types) {
      const typeList = types.split(',');
      query = query.in('type', typeList);
    }
    
    // Create a SQL statement for the spatial filtering
    // This computes the distance between each service and the user's location
    const { data, error } = await supabase.rpc(
      'find_services_within_distance',
      {
        user_lat: parseFloat(lat),
        user_lng: parseFloat(lon),
        radius_km: parseFloat(radiusKm)
      }
    ).catch(async (err) => {
      // If the RPC function doesn't exist, fall back to a basic query
      console.log("RPC function not found, using fallback query:", err);
      
      // Basic query without PostGIS
      return await query;
    });

    if (error) {
      console.error('Database query error:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    console.log(`Found ${data?.length || 0} emergency services`)
    
    // Return the data directly, not wrapped in an object
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    console.error('Edge function error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
