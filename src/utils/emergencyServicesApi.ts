
import { toast } from 'sonner';
import { EmergencyService } from '../types/mapTypes';

const EDGE_FUNCTION_URL = "https://ljsmrxbbkbleugkpehcl.supabase.co/functions/v1/get-emergency-services";

/**
 * Fetches emergency services from the Supabase Edge Function
 * @returns A promise that resolves to an array of emergency services
 */
export async function fetchEmergencyServices(): Promise<EmergencyService[]> {
  try {
    console.log("Fetching emergency services from Edge Function");
    const response = await fetch(EDGE_FUNCTION_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch emergency services: ${response.status}`);
    }
    
    const json = await response.json();
    
    if (!json.data) {
      throw new Error('Invalid response format: missing data property');
    }
    
    return json.data;
  } catch (err: any) {
    console.error("Error fetching emergency services:", err.message);
    toast.error("Failed to load emergency services");
    return [];
  }
}
