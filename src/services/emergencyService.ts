
import { EmergencyService } from '@/types/mapTypes';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Fetches the nearest emergency services from the Supabase Edge Function
 * @param lat Latitude of the center point
 * @param lng Longitude of the center point
 * @param radiusKm Radius in kilometers to search within (optional, default 30)
 * @param types Array of service types to filter by (optional)
 * @param limit Maximum number of services to return (optional)
 * @returns Promise<EmergencyService[]> Array of emergency services
 */
export async function fetchNearestEmergencyServices(
  lat: number,
  lng: number,
  radiusKm: number = 30,
  types?: string[],
  limit?: number
): Promise<EmergencyService[]> {
  try {
    console.log(`Fetching services near ${lat}, ${lng} with radius ${radiusKm}km`);
    
    // Build the parameters object
    const params: Record<string, string> = {
      lat: lat.toString(),
      lon: lng.toString(),
    };
    
    if (radiusKm) {
      params.radius = radiusKm.toString();
    }
    
    if (types && types.length > 0) {
      params.types = types.join(',');
    }
    
    if (limit) {
      params.limit = limit.toString();
    }
    
    // Call the Edge Function with the built parameters
    const { data, error } = await supabase.functions.invoke('get-emergency-services', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: params
    });
    
    if (error) {
      throw new Error(`Edge Function Error: ${error.message}`);
    }
    
    if (!data || !Array.isArray(data)) {
      throw new Error("Invalid response format from Edge Function");
    }
    
    console.log(`Fetched ${data.length} services from Edge Function`);
    
    return data as EmergencyService[];
  } catch (error) {
    console.error('Error fetching emergency services:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    toast.error(`Error fetching emergency services: ${errorMessage}`);
    throw error;
  }
}

/**
 * Fetches services from the Edge Function
 * This is a simplified version used for connection testing
 */
export async function fetchServicesFromEdge(lat: number, lon: number): Promise<EmergencyService[]> {
  try {
    const { data, error } = await supabase.functions.invoke('get-emergency-services', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: { lat, lon }
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data as EmergencyService[];
  } catch (error) {
    console.error('Error calling edge function:', error);
    throw error;
  }
}

/**
 * Fetches route path between two points
 * @param startLat Starting latitude
 * @param startLng Starting longitude
 * @param endLat Ending latitude
 * @param endLng Ending longitude
 * @returns Route data including points, distance, duration, and steps
 */
export async function fetchRoutePath(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
) {
  try {
    console.log(`Fetching route from [${startLat}, ${startLng}] to [${endLat}, ${endLng}]`);
    
    // Mock route data for now - in a real implementation this would call 
    // an edge function or API that connects to Google Maps/other routing provider
    const directDistance = calculateHaversineDistance(startLat, startLng, endLat, endLng);
    
    // Generate some points along a direct path between start and end
    const points: [number, number][] = [];
    const steps = 10;
    
    for (let i = 0; i <= steps; i++) {
      const fraction = i / steps;
      const lat = startLat + (endLat - startLat) * fraction;
      const lng = startLng + (endLng - startLng) * fraction;
      points.push([lat, lng]);
    }
    
    // Mock step-by-step directions
    const mockSteps = [
      {
        distance: directDistance * 0.3 * 1000, // Convert to meters
        duration: directDistance * 0.3 * 60, // Rough estimate: 1 minute per km
        instructions: "Head <b>north</b> on Main Street"
      },
      {
        distance: directDistance * 0.2 * 1000,
        duration: directDistance * 0.2 * 60,
        instructions: "Turn <b>right</b> onto Oak Avenue"
      },
      {
        distance: directDistance * 0.5 * 1000,
        duration: directDistance * 0.5 * 60,
        instructions: "Continue onto <b>Hospital Drive</b>"
      }
    ];
    
    return {
      points, // Array of [lat, lng] coordinates
      distance: directDistance, // Total distance in km
      duration: directDistance / 50 * 60, // Estimate time in minutes (assuming 50 km/h)
      steps: mockSteps
    };
  } catch (error) {
    console.error('Error fetching route path:', error);
    toast.error('Could not calculate route. Using direct path instead.');
    throw error;
  }
}

/**
 * Calculate the great-circle distance between two points using Haversine formula
 */
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in km
  
  return distance;
}

/**
 * Convert degrees to radians
 */
function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}
