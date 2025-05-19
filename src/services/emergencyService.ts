
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
    
    // Build the query parameters
    const params = new URLSearchParams();
    params.append('lat', lat.toString());
    params.append('lon', lng.toString());
    
    if (radiusKm) {
      params.append('radius', radiusKm.toString());
    }
    
    if (types && types.length > 0) {
      params.append('types', types.join(','));
    }
    
    if (limit) {
      params.append('limit', limit.toString());
    }
    
    // Call the Edge Function with the built parameters
    const { data, error } = await supabase.functions.invoke('get-emergency-services', {
      method: 'GET',
      query: params,
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
      query: { lat, lon }
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
