
import { useState } from 'react';
import { EmergencyService } from '@/types/mapTypes';
import { toast } from 'sonner';
import { fetchNearestEmergencyServices } from '@/services/emergencyService';
import { supabase } from '@/integrations/supabase/client';

export function useEmergencyServicesApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  /**
   * Fetches nearby emergency services within a specified radius and limits the number returned
   */
  const fetchNearbyEmergencyServices = async (
    lat: number, 
    lng: number, 
    radiusInKm: number = 30,
    types?: string[],
    limit?: number
  ): Promise<EmergencyService[]> => {
    setIsLoading(true);
    setError(null);
    console.log(`Searching for services near ${lat}, ${lng} with radius ${radiusInKm}km`);
    
    try {
      // Use the fetchNearestEmergencyServices function from emergencyService.ts
      // Which now calls the database directly
      const services = await fetchNearestEmergencyServices(
        lat,
        lng,
        radiusInKm,
        types,
        limit
      );
      
      if (services.length === 0) {
        toast.warning("No emergency services found within the specified radius");
      } else {
        const serviceTypes = [...new Set(services.map(s => s.type))];
        console.log(`Found ${services.length} emergency services of types: ${serviceTypes.join(', ')}`);
      }
      return services;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching emergency services:', err);
      toast.error(`Error: ${errorMessage}`);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Imports emergency services in batches using direct Supabase access
   */
  const batchImportServices = async (services: EmergencyService[]): Promise<{success: boolean, imported: number, errors: number}> => {
    setIsLoading(true);
    setError(null);
    setUploadProgress(0);
    
    try {
      if (!services || services.length === 0) {
        return { success: true, imported: 0, errors: 0 };
      }
      
      console.log(`Importing ${services.length} emergency services`);
      
      const batchSize = 100;
      let imported = 0;
      let errors = 0;
      
      // Process in batches to avoid payload size limits
      for (let i = 0; i < services.length; i += batchSize) {
        const batch = services.slice(i, i + batchSize);
        
        // Convert EmergencyService objects to database format
        const dbRecords = batch.map(service => ({
          id: service.id,
          name: service.name,
          type: service.type,
          latitude: service.latitude,
          longitude: service.longitude,
          address: service.address || null,
          phone: service.phone || null,
          hours: service.hours || null
        }));
        
        const { data, error } = await supabase
          .from('emergency_services')
          .upsert(dbRecords, { 
            onConflict: 'id',
            ignoreDuplicates: false
          });
          
        if (error) {
          console.error("Batch import error:", error);
          errors += batch.length;
        } else {
          imported += batch.length;
        }
        
        // Update progress
        setUploadProgress(Math.round((i + batch.length) / services.length * 100));
      }
      
      const success = errors === 0;
      if (success) {
        toast.success(`Successfully imported ${imported} emergency services`);
      } else if (imported > 0) {
        toast.warning(`Partially imported emergency services: ${imported} succeeded, ${errors} failed`);
      } else {
        toast.error(`Failed to import emergency services`);
      }
      
      return { success, imported, errors };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Error importing services:', err);
      return { success: false, imported: 0, errors: services.length };
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };
  
  return {
    fetchNearbyEmergencyServices,
    batchImportServices,
    isLoading,
    uploadProgress,
    error
  };
}
