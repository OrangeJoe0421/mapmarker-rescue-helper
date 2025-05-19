
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

/**
 * Checks the database connection and returns the number of records available
 * @returns Promise<{ success: boolean, message: string, count?: number }>
 */
export async function checkDatabaseConnection(): Promise<{ success: boolean, message: string, count?: number }> {
  try {
    console.log("Checking database connection via direct Supabase client...");
    
    // Query the emergency_services table directly using the Supabase client
    const { data, error, count } = await supabase
      .from('emergency_services')
      .select('*', { count: 'exact' })
      .limit(0);
    
    if (error) {
      console.error("Database connection check failed:", error);
      throw new Error(`Database error: ${error.message}`);
    }
    
    console.log("Connection successful, got count:", count);
    
    return {
      success: true,
      message: `Connected successfully to database`,
      count: count || 0
    };
  } catch (error) {
    console.error("Database connection check failed:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Fetches emergency services within a specified geographic bounding box
 * @param latitude User's latitude
 * @param longitude User's longitude
 * @param radiusKm Radius in kilometers to search within
 * @returns Promise with filtered emergency services
 */
export async function fetchEmergencyServicesWithinRadius(
  latitude: number, 
  longitude: number, 
  radiusKm: number = 30
): Promise<any[]> {
  // Calculate a bounding box for the given radius to filter results
  // This is a simple approximation - 0.01 ≈ 1.11km at the equator
  // We use a larger multiplier to be safe
  const approxDegreesPerKm = 0.01;
  const latDelta = radiusKm * approxDegreesPerKm;
  const lonDelta = radiusKm * approxDegreesPerKm;
  
  const minLat = latitude - latDelta;
  const maxLat = latitude + latDelta;
  const minLon = longitude - lonDelta;
  const maxLon = longitude + lonDelta;
  
  console.log(`Searching within bounding box: [${minLat},${minLon}] to [${maxLat},${maxLon}]`);
  
  try {
    const { data, error } = await supabase
      .from('emergency_services')
      .select('*')
      .gte('latitude', minLat)
      .lte('latitude', maxLat)
      .gte('longitude', minLon)
      .lte('longitude', maxLon);
    
    if (error) {
      console.error("Error fetching services from database:", error);
      throw new Error(`Database query error: ${error.message}`);
    }
    
    console.log(`Found ${data?.length || 0} services within the bounding box`);
    return data || [];
  } catch (error) {
    console.error("Failed to fetch emergency services:", error);
    throw error;
  }
}
