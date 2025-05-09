
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { EmergencyService } from '@/types/mapTypes';
import { Database } from '@/types/database';
import { toast } from 'sonner';

export function useEmergencyServicesApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  /**
   * Fetches nearby emergency services within a specified radius and limits the number returned
   * Can optionally return only the closest of each service type
   */
  const fetchNearbyEmergencyServices = async (
    lat: number, 
    lng: number, 
    radiusInKm: number = 30,
    types?: string[],
    limit?: number,
    closestByType: boolean = false
  ): Promise<EmergencyService[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('emergency_services')
        .select('*');
      
      // Filter by type if provided
      if (types && types.length > 0) {
        query = query.in('type', types);
      }
      
      // Get all within reasonable distance first - we'll sort by actual distance later
      // This is a simple filter to reduce the data set
      const latDiff = radiusInKm / 111; // ~111km per degree of latitude
      const lngDiff = radiusInKm / (111 * Math.cos(lat * Math.PI / 180)); // Adjust for longitude differences
      
      query = query
        .gt('latitude', lat - latDiff)
        .lt('latitude', lat + latDiff)
        .gt('longitude', lng - lngDiff)
        .lt('longitude', lng + lngDiff);
      
      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Failed to fetch emergency services: ${error.message}`);
      }
      
      if (!data || data.length === 0) {
        return [];
      }
      
      console.log(`Found ${data.length} emergency services from database within coordinate bounds`);
      
      // Calculate actual distances and filter by radius
      const servicesWithDistance = data.map(service => {
        const distanceKm = calculateDistance(
          lat, 
          lng, 
          service.latitude, 
          service.longitude
        );
        
        return {
          id: service.id,
          name: service.name,
          type: service.type,
          latitude: service.latitude,
          longitude: service.longitude,
          address: service.address || undefined,
          phone: service.phone || undefined,
          hours: service.hours || undefined,
          distance: distanceKm
        } as EmergencyService;
      })
      .filter(service => service.distance <= radiusInKm)
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));
      
      // Get the closest of each service type if requested
      if (closestByType) {
        const servicesByType: Record<string, EmergencyService> = {};
        
        // Extract main service categories
        const serviceTypes = ["Hospital", "Fire", "EMS", "Law Enforcement", "Police"];
        
        // For each service, check if it belongs to one of our main categories
        // and if it's closer than what we've found so far
        servicesWithDistance.forEach(service => {
          // Normalize the service type for comparison
          const normalizedType = normalizeServiceType(service.type);
          
          // If we haven't found this type yet, or this is closer than what we have
          if (!servicesByType[normalizedType] || 
              (service.distance || Infinity) < (servicesByType[normalizedType].distance || Infinity)) {
            servicesByType[normalizedType] = service;
          }
        });
        
        // Convert back to array
        const closestServices = Object.values(servicesByType);
        
        return closestServices.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      }
      
      // Apply limit if specified and not getting closest by type
      if (limit && limit > 0) {
        return servicesWithDistance.slice(0, limit);
      }
      
      return servicesWithDistance;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching emergency services:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Normalizes service types to common categories
   */
  const normalizeServiceType = (type: string): string => {
    const lowerType = type.toLowerCase();
    
    if (lowerType.includes('hospital') || lowerType.includes('medical center')) {
      return 'Hospital';
    } else if (lowerType.includes('fire')) {
      return 'Fire';
    } else if (lowerType.includes('ems') || lowerType.includes('ambulance') || lowerType.includes('emergency medical')) {
      return 'EMS';
    } else if (lowerType.includes('police') || lowerType.includes('sheriff') || lowerType.includes('law') || lowerType.includes('enforce')) {
      return 'Law Enforcement';
    } else {
      // Return the original type if it doesn't match our categories
      return type;
    }
  };

  /**
   * Imports emergency services in batches to avoid payload size limits
   */
  const batchImportServices = async (services: EmergencyService[]): Promise<{success: boolean, imported: number, errors: number}> => {
    setIsLoading(true);
    setError(null);
    setUploadProgress(0);
    
    try {
      // Process in smaller batches to avoid payload limits
      const batchSize = 25; // Smaller batch size to avoid payload limits
      const totalBatches = Math.ceil(services.length / batchSize);
      let importedCount = 0;
      let errorCount = 0;
      
      console.log(`Starting batch import of ${services.length} services in ${totalBatches} batches`);
      
      for (let i = 0; i < services.length; i += batchSize) {
        const batch = services.slice(i, i + batchSize);
        const currentBatch = Math.floor(i / batchSize) + 1;
        
        console.log(`Processing batch ${currentBatch}/${totalBatches} (${batch.length} items)`);
        
        try {
          const { data, error, count } = await supabase
            .from('emergency_services')
            .upsert(
              batch.map(item => ({
                id: item.id,
                name: item.name,
                type: item.type,
                latitude: item.latitude,
                longitude: item.longitude,
                address: item.address || null,
                phone: item.phone || null,
                hours: item.hours || null,
              })),
              { onConflict: 'id', count: 'exact' }
            );
            
          if (error) {
            console.error('Error in batch:', error);
            console.error('Problem batch:', JSON.stringify(batch.slice(0, 2)));
            errorCount += batch.length;
          } else {
            importedCount += count || batch.length;
          }
          
          // Update progress
          const progress = Math.min(100, Math.round(((i + batch.length) / services.length) * 100));
          setUploadProgress(progress);
          
          // Small delay to avoid overwhelming the database
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (batchError) {
          console.error('Batch processing error:', batchError);
          console.error('Problem batch index:', i);
          errorCount += batch.length;
        }
      }
      
      return { 
        success: importedCount > 0, 
        imported: importedCount, 
        errors: errorCount 
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
  
  // Haversine formula to calculate distance between two points in km
  const calculateDistance = (
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    
    return parseFloat(distance.toFixed(2));
  };
  
  return {
    fetchNearbyEmergencyServices,
    batchImportServices,
    isLoading,
    uploadProgress,
    error
  };
}
