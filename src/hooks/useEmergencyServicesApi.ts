
import { useState } from 'react';
import { EmergencyService } from '@/types/mapTypes';
import { toast } from 'sonner';
import { fetchNearestEmergencyServices } from '@/services/emergencyService';

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
      // This now passes the location to the edge function and ensures we get one of each service type
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
        const serviceTypes = services.map(s => s.type);
        const uniqueTypes = [...new Set(serviceTypes)]; // Get unique types
        console.log(`Found ${services.length} emergency services of types: ${uniqueTypes.join(', ')}`);
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
   * Imports emergency services in batches to avoid payload size limits
   * This function is no longer using direct Supabase calls, but for backwards compatibility,
   * we'll keep the function signature and update the implementation
   */
  const batchImportServices = async (services: EmergencyService[]): Promise<{success: boolean, imported: number, errors: number}> => {
    setIsLoading(true);
    setError(null);
    setUploadProgress(0);
    
    try {
      // This functionality is now handled by the Edge Function
      // Here we could make a call to an edge function that handles batch imports if needed
      console.log('This functionality has been migrated to use Edge Functions');
      toast.warning('Batch import is currently not supported through the Edge Function');
      
      return { 
        success: false, 
        imported: 0, 
        errors: 0
      };
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
