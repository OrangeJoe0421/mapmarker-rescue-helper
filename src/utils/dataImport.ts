
import { supabase } from '@/integrations/supabase/client';
import { EmergencyService } from '@/types/mapTypes';
import { toast } from 'sonner';

/**
 * Imports emergency services data from JSON files to Supabase
 * @param jsonData Array of emergency service objects
 * @param serviceType The type of service (Hospital, Fire Station, etc.)
 * @returns Promise with the number of records imported
 */
export async function importEmergencyServices(
  jsonData: any[],
  serviceType: string
): Promise<number> {
  try {
    console.log(`Starting import of ${jsonData.length} ${serviceType} records`);
    
    let importedCount = 0;
    let errorCount = 0;
    
    // Process in batches of 50 to avoid rate limiting
    const batchSize = 50;
    
    for (let i = 0; i < jsonData.length; i += batchSize) {
      const batch = jsonData.slice(i, i + batchSize).map(item => {
        // Generate a unique ID if none exists
        const id = item.id || `${serviceType.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
        
        // Map the JSON structure to our database schema
        return {
          id,
          name: item.name || 'Unnamed Service',
          type: serviceType,
          latitude: parseFloat(item.latitude || item.lat),
          longitude: parseFloat(item.longitude || item.lng),
          address: item.address,
          phone: item.phone,
          hours: item.hours || '24/7',
        };
      });
      
      // Insert the batch into Supabase
      const { data, error } = await supabase
        .from('emergency_services')
        .upsert(batch, { onConflict: 'id' })
        .select();
      
      if (error) {
        console.error('Error importing batch:', error);
        errorCount += batch.length;
      } else {
        importedCount += data.length;
        console.log(`Imported ${data.length} records. Total: ${importedCount}`);
      }
      
      // Small delay to prevent overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    if (errorCount > 0) {
      toast.error(`Import complete with ${errorCount} errors. Please check console.`);
    } else {
      toast.success(`Successfully imported ${importedCount} ${serviceType} records`);
    }
    
    return importedCount;
  } catch (error) {
    console.error('Error in importEmergencyServices:', error);
    toast.error('Failed to import data. See console for details.');
    throw error;
  }
}

/**
 * Clears all emergency services of a specific type from the database
 * @param serviceType Type of service to clear (or leave empty for all)
 */
export async function clearEmergencyServices(serviceType?: string): Promise<void> {
  try {
    let query = supabase.from('emergency_services');
    
    if (serviceType) {
      // Use delete() method after applying filter
      const { error } = await query.delete().eq('type', serviceType);
      
      if (error) {
        console.error('Error clearing emergency services:', error);
        toast.error('Failed to clear existing services');
        throw error;
      }
    } else {
      // Delete all records
      const { error } = await query.delete();
      
      if (error) {
        console.error('Error clearing all emergency services:', error);
        toast.error('Failed to clear existing services');
        throw error;
      }
    }
    
    toast.success(`${serviceType || 'All'} emergency services cleared`);
  } catch (error) {
    console.error('Error in clearEmergencyServices:', error);
    throw error;
  }
}
