
import { toast } from 'sonner';
import { fetchServicesFromEdge } from '@/services/emergencyService';

/**
 * Checks the database connection and returns the number of records available
 * @returns Promise<{ success: boolean, message: string, count?: number }>
 */
export async function checkDatabaseConnection(): Promise<{ success: boolean, message: string, count?: number }> {
  try {
    console.log("Checking database connection via Edge Function...");
    
    // Use default coordinates for connection testing (San Francisco coordinates)
    const defaultLat = 37.7749;
    const defaultLon = -122.4194;
    
    // Try to fetch data from the edge function
    console.log("Calling fetchServicesFromEdge with coordinates:", defaultLat, defaultLon);
    const data = await fetchServicesFromEdge(defaultLat, defaultLon);
    
    if (!data || !Array.isArray(data)) {
      console.error("Invalid response format:", data);
      throw new Error("Invalid response from service");
    }
    
    console.log("Connection successful, got data:", data.length, "records");
    
    return {
      success: true,
      message: `Connected successfully`,
      count: data.length
    };
  } catch (error) {
    console.error("Database connection check failed:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
