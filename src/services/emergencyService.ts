
import { toast } from 'sonner';
import { EmergencyService } from '../types/mapTypes';
import { getAllEmsData, getEmsDataWithinRadius } from './sampleDataService';
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

export async function fetchNearestEmergencyServices(latitude: number, longitude: number): Promise<EmergencyService[]> {
  try {
    console.log(`Fetching services near [${latitude}, ${longitude}]`);
    
    // Get EMS data from our sample database
    const allServices = getAllEmsData();
    
    // Filter services within 20km radius for more relevant results
    const nearbyServices = getEmsDataWithinRadius(latitude, longitude, 20);
    
    // If no nearby services, return all services
    const services = nearbyServices.length > 0 ? nearbyServices : allServices;
    
    // Calculate straight-line distance from user location
    const servicesWithDistance = services.map(service => {
      // Calculate straight-line distance
      const airDistance = calculateHaversineDistance(
        latitude,
        longitude,
        service.latitude,
        service.longitude
      );
      
      return {
        ...service,
        // Use estimated road distance (air distance * 1.3) initially
        road_distance: airDistance * 1.3,
      };
    });
    
    // Sort initially by air distance
    const sortedServices = servicesWithDistance.sort((a, b) => 
      (a.road_distance || Infinity) - (b.road_distance || Infinity)
    );

    // Filter to only include the closest service of each type
    const serviceTypes = new Set(sortedServices.map(service => service.type));
    const closestByType: EmergencyService[] = [];
    
    serviceTypes.forEach(type => {
      const closestOfType = sortedServices.find(service => service.type === type);
      if (closestOfType) {
        closestByType.push(closestOfType);
      }
    });
    
    // Now queue up road distance calculations (don't wait for them)
    closestByType.forEach(service => {
      queueRequest(async () => {
        try {
          const roadDistance = await fetchRouteDistance(
            latitude,
            longitude,
            service.latitude,
            service.longitude
          );
          
          if (roadDistance !== null) {
            // Update the service with the road distance
            service.road_distance = roadDistance;
          }
        } catch (error) {
          console.warn(`Could not calculate road distance for ${service.name}:`, error);
        }
      });
    });
    
    return closestByType;
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
