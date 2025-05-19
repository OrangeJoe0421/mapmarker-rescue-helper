
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
    
    console.log("Calling fetchServicesFromEdge with coordinates:", defaultLat, defaultLon);
    
    // Try to fetch data from the edge function with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const data = await fetchServicesFromEdge(defaultLat, defaultLon);
      clearTimeout(timeoutId);
      
      if (!data || !Array.isArray(data)) {
        console.error("Invalid response format:", data);
        throw new Error("Invalid response from service");
      }
      
      console.log("Connection successful, got data:", data.length, "records");
      
      return {
        success: true,
        message: `Connected successfully to database`,
        count: data.length
      };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error("Fetch error during connection check:", fetchError);
      
      if (fetchError.name === 'AbortError') {
        throw new Error("Connection timed out after 10 seconds");
      }
      
      throw fetchError;
    }
  } catch (error) {
    console.error("Database connection check failed:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
