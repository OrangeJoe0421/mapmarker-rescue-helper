
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
