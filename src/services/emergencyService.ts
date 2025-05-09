
import { toast } from 'sonner';
import { EmergencyService } from '../types/mapTypes';
import { supabase } from '@/integrations/supabase/client';
import { calculateHaversineDistance } from '../utils/mapUtils';

// OSRM API for routing (open source routing machine)
const OSRM_API_URL = "https://router.project-osrm.org/route/v1/driving/";

// Queue for managing API requests to prevent rate limiting
const requestQueue: (() => Promise<void>)[] = [];
let isProcessingQueue = false;

// Process the queue with rate limiting (one request per second)
async function processQueue() {
  if (isProcessingQueue || requestQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  while (requestQueue.length > 0) {
    const request = requestQueue.shift();
    if (request) {
      try {
        await request();
      } catch (error) {
        console.error("Error processing queued request:", error);
      }
      // Wait 1.2 seconds between requests to stay under the rate limit
      await new Promise(resolve => setTimeout(resolve, 1200));
    }
  }
  
  isProcessingQueue = false;
}

// Add a request to the queue and start processing if needed
function queueRequest(request: () => Promise<void>) {
  requestQueue.push(request);
  processQueue();
}

export async function fetchNearestEmergencyServices(latitude: number, longitude: number, radius: number = 30, types?: string[], limit?: number): Promise<EmergencyService[]> {
  try {
    console.log(`Fetching services from database near [${latitude}, ${longitude}] with limit ${limit || 'unlimited'}`);
    
    // Use the useEmergencyServicesApi hook's function directly via the supabase client
    const { data, error } = await supabase
      .from('emergency_services')
      .select('*');
    
    if (error) {
      console.error("Supabase query error:", error);
      toast.error("Failed to fetch emergency services from database");
      return [];
    }
    
    if (!data || data.length === 0) {
      toast.info("No emergency services found in the database");
      return [];
    }
    
    console.log(`Found ${data.length} services in database, calculating distances...`);
    
    // Calculate distances for all services
    const servicesWithDistance = await Promise.all(
      data.map(async service => {
        try {
          const roadDistance = await fetchRouteDistance(
            latitude,
            longitude,
            service.latitude,
            service.longitude
          );
          
          // Convert database model to EmergencyService type
          const emergencyService: EmergencyService = {
            id: service.id,
            name: service.name,
            type: service.type,
            latitude: service.latitude,
            longitude: service.longitude,
            address: service.address || undefined,
            phone: service.phone || undefined,
            hours: service.hours || undefined,
            road_distance: roadDistance
          };
          
          return emergencyService;
        } catch (error) {
          console.warn(`Could not calculate road distance for ${service.name}:`, error);
          
          // Return service with haversine distance as fallback
          return {
            id: service.id,
            name: service.name,
            type: service.type,
            latitude: service.latitude,
            longitude: service.longitude,
            address: service.address || undefined,
            phone: service.phone || undefined,
            hours: service.hours || undefined,
            road_distance: calculateHaversineDistance(latitude, longitude, service.latitude, service.longitude) * 1.3
          };
        }
      })
    );
    
    // Filter by type if specified
    let filteredServices = servicesWithDistance;
    if (types && types.length > 0) {
      filteredServices = filteredServices.filter(service => 
        types.some(type => service.type.toLowerCase().includes(type.toLowerCase()))
      );
    }
    
    // Filter by radius
    filteredServices = filteredServices.filter(service => 
      (service.road_distance || Infinity) <= radius
    );

    // Sort services by distance
    const sortedServices = filteredServices.sort((a, b) => {
      // Sort by road distance
      return (a.road_distance || Infinity) - (b.road_distance || Infinity);
    });
    
    // Apply limit if specified
    if (limit && limit > 0) {
      return sortedServices.slice(0, limit);
    }
    
    return sortedServices;
  } catch (error) {
    console.error("Error fetching emergency services:", error);
    toast.error("Failed to fetch emergency services. Please try again.");
    return [];
  }
}

// Use OSRM API to get actual road distance
export async function fetchRouteDistance(
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number
): Promise<number | null> {
  try {
    // Format coordinates for OSRM API
    const coordinates = `${startLon},${startLat};${endLon},${endLat}`;
    const url = `${OSRM_API_URL}${coordinates}?overview=full`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`OSRM API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error('No route found');
    }
    
    // Get distance in kilometers (OSRM returns meters)
    const distanceKm = data.routes[0].distance / 1000;
    return parseFloat(distanceKm.toFixed(2));
  } catch (error) {
    console.error("Error calculating route distance:", error);
    // Fall back to Haversine distance with a road factor
    return calculateHaversineDistance(startLat, startLon, endLat, endLon) * 1.3;
  }
}

// Function to fetch a route with all waypoints 
export async function fetchRoutePath(
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number
): Promise<{ points: [number, number][]; distance: number; duration: number } | null> {
  return new Promise((resolve) => {
    queueRequest(async () => {
      try {
        // Format coordinates for OSRM API
        const coordinates = `${startLon},${startLat};${endLon},${endLat}`;
        const url = `${OSRM_API_URL}${coordinates}?overview=full&geometries=geojson`;
        
        console.log("Fetching route path:", url);
        const response = await fetch(url);
        
        if (!response.ok) {
          console.error(`OSRM API error: ${response.status} ${response.statusText}`);
          throw new Error(`OSRM API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
          throw new Error('No route found');
        }
        
        const route = data.routes[0];
        const geometry = route.geometry;
        
        // Extract coordinates from GeoJSON
        const points = geometry.coordinates.map((coord: [number, number]) => {
          // OSRM returns [lng, lat], but we need [lat, lng] for leaflet
          return [coord[1], coord[0]] as [number, number];
        });
        
        resolve({
          points,
          distance: route.distance / 1000, // convert meters to kilometers
          duration: route.duration / 60, // convert seconds to minutes
        });
      } catch (error) {
        console.error("Error fetching route path:", error);
        
        // Create a fallback route with just start and end points
        console.log("Using fallback route calculation");
        const fallbackPoints: [number, number][] = [
          [startLat, startLon],
          [endLat, endLon]
        ];
        
        const distance = calculateHaversineDistance(startLat, startLon, endLat, endLon);
        resolve({
          points: fallbackPoints,
          distance: distance,
          duration: distance / 50 * 60 // Rough estimate: 50 km/h average speed
        });
      }
    });
  });
}
