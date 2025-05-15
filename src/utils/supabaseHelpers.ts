import { toast } from 'sonner';
import { fetchServicesFromEdge } from '@/services/emergencyService';

/**
 * Checks if the Supabase connection is working
 * @returns An object containing connection status and record count information
 */
export async function checkDatabaseConnection() {
  try {
    // Try to fetch data from the Edge Function instead of direct Supabase call
    console.log("Checking Edge Function connection...");
    
    const data = await fetchServicesFromEdge();
    
    if (!data) {
      throw new Error("No data returned from Edge Function");
    }
    
    return {
      success: true,
      message: `Connected successfully`,
      count: data.length || 0
    };
  } catch (err) {
    console.error("Edge Function connection error:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Unknown connection error",
      count: 0
    };
  }
}

/**
 * Checks if the given Supabase URL and key are valid
 * Useful for debugging connection issues
 */
export function validateSupabaseCredentials(url: string, key: string): boolean {
  // Basic validation
  if (!url || !key) {
    console.error("Missing Supabase URL or key");
    return false;
  }

  // Validate URL format
  try {
    new URL(url);
  } catch (e) {
    console.error("Invalid Supabase URL format:", url);
    return false;
  }

  // Validate key format (should be JWT)
  const jwtPattern = /^eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*$/;
  if (!jwtPattern.test(key)) {
    console.error("Invalid Supabase key format");
    return false;
  }

  return true;
}

/**
 * Attempts to get a record by ID from the emergency services table
 */
export async function getEmergencyServiceById(id: string) {
  try {
    // Fetch all services from Edge Function
    const services = await fetchServicesFromEdge();
    
    // Find the specific service by ID
    const service = services.find(s => s.id === id);
    
    return { 
      success: !!service, 
      data: service || null, 
      error: service ? null : new Error('Service not found') 
    };
  } catch (err) {
    return { 
      success: false, 
      data: null, 
      error: err instanceof Error ? err : new Error('Unknown error')
    };
  }
}

/**
 * Display common Supabase errors in a user-friendly way
 */
export function handleSupabaseError(error: any, context: string = 'operation') {
  if (!error) return;
  
  console.error(`Supabase ${context} error:`, error);
  
  // Handle common Supabase errors
  if (typeof error === 'object' && error !== null) {
    const code = error.code || '';
    const message = error.message || 'Unknown database error';

    // Show appropriate toast based on error type
    if (code.includes('auth') || message.includes('auth')) {
      toast.error(`Authentication error: ${message}`);
    } else if (code === '42P01' || message.includes('relation') && message.includes('does not exist')) {
      toast.error('Database table not found. Please check your database setup.');
    } else if (code === '23505') {
      toast.error('Duplicate record found. This item already exists.');
    } else if (code === '23503') {
      toast.error('Referenced record not found. Please check related data.');
    } else {
      toast.error(`Database error: ${message}`);
    }
  } else {
    toast.error(`Database error during ${context}`);
  }
}
