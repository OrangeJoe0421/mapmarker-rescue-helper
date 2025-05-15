
import { toast } from 'sonner';
import { fetchServicesFromEdge } from '@/services/emergencyService';

/**
 * Checks the database connection and returns the number of records available
 * @returns Promise<{ success: boolean, message: string, count?: number }>
 */
export async function checkDatabaseConnection(): Promise<{ success: boolean, message: string, count?: number }> {
  try {
    console.log("Checking database connection via Edge Function...");
    
    const data = await fetchServicesFromEdge();
    
    if (!data || !Array.isArray(data)) {
      throw new Error("Invalid response from service");
    }
    
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
