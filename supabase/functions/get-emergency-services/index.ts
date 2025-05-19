
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get URL and extract query parameters
    const url = new URL(req.url);
    const lat = parseFloat(url.searchParams.get("lat") || "0");
    const lon = parseFloat(url.searchParams.get("lon") || "0");
    const radius = parseFloat(url.searchParams.get("radius") || "30");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const types = url.searchParams.get("types")?.split(",") || [];

    // Validate parameters
    if (isNaN(lat) || isNaN(lon)) {
      return new Response(
        JSON.stringify({ error: "Invalid coordinates provided" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get Supabase client using environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build query for nearby emergency services
    let query = supabase
      .from("emergency_services")
      .select("*");

    // Add type filter if provided
    if (types.length > 0) {
      query = query.in("type", types);
    }

    // Execute the query
    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Calculate distance and filter by radius
    const services = data
      .map(service => {
        const distance = calculateDistance(
          lat, 
          lon, 
          service.latitude, 
          service.longitude
        );
        return { ...service, distance };
      })
      .filter(service => service.distance <= radius)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);

    // Return the results
    return new Response(
      JSON.stringify(services),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

/**
 * Calculate the distance between two points using the Haversine formula
 * @returns Distance in kilometers
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
