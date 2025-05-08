
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { EmergencyService } from '@/types/mapTypes';
import { Database } from '@/types/database';

export function useEmergencyServicesApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNearbyEmergencyServices = async (
    lat: number, 
    lng: number, 
    radiusInKm: number = 30,
    types?: string[]
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
    isLoading,
    error
  };
}
