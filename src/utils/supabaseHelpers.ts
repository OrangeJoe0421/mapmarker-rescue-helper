
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

/**
 * Checks if the Supabase connection is working
 * @returns An object containing connection status and record count information
 */
export async function checkDatabaseConnection() {
  try {
    // First try a simple ping query
    const { error: pingError } = await supabase
      .from('emergency_services')
      .select('id', { count: 'exact', head: true })
      .limit(1);

    if (pingError) {
      console.error("Supabase ping error:", pingError);
      return { 
        success: false, 
        message: `Connection error: ${pingError.message}`,
        count: 0
      };
    }

    // If ping works, get the count
    const { count, error: countError } = await supabase
      .from('emergency_services')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error("Supabase count error:", countError);
      return { 
        success: false, 
        message: `Data error: ${countError.message}`,
        count: 0
      };
    }

    return {
      success: true,
      message: `Connected successfully`,
      count: count || 0
    };
  } catch (err) {
    console.error("Unexpected database error:", err);
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
 * Attempts to get a record by ID from the specified table
 * Useful for testing specific table access
 */
export async function testTableAccess(tableName: string, id: string) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .single();
    
    return { success: !error, data, error };
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
