
import { toast } from 'sonner';
import { EmergencyService } from '../types/mapTypes';
import { supabase } from '@/integrations/supabase/client';
import { calculateHaversineDistance } from '../utils/mapUtils';

const EMERGENCY_SERVICE_TYPES = {
  HOSPITAL: 'hospital',
  FIRE_STATION: 'fire_station',
  POLICE: 'police',
  EMS: 'doctor' // Note: EMS stations don't have a specific Google Places type
};

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

async function searchNearbyPlaces(
  latitude: number, 
  longitude: number, 
  type: string,
  radius: number = 20000 // 20km radius
): Promise<google.maps.places.PlaceResult[]> {
  const service = new google.maps.places.PlacesService(
    document.createElement('div')
  );

  return new Promise((resolve, reject) => {
    const request = {
      location: { lat: latitude, lng: longitude },
      radius,
      type
    };

    service.nearbySearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        resolve(results);
      } else {
        reject(new Error(`Places API error: ${status}`));
      }
    });
  });
}

async function convertToEmergencyService(
  place: google.maps.places.PlaceResult,
  type: string
): Promise<EmergencyService> {
  const service: EmergencyService = {
    id: place.place_id || crypto.randomUUID(),
    name: place.name || 'Unknown',
    type,
    latitude: place.geometry?.location?.lat() || 0,
    longitude: place.geometry?.location?.lng() || 0,
    address: place.vicinity || undefined,
  };

  // If it's a hospital, fetch verification data
  if (type.toLowerCase().includes('hospital')) {
    const { data: verification } = await supabase
      .from('latest_hospital_verifications')
      .select('*')
      .eq('service_id', service.id)
      .single();

    if (verification) {
      service.verification = {
        hasEmergencyRoom: verification.has_emergency_room || false,
        verifiedAt: verification.verified_at ? new Date(verification.verified_at) : null
      };
    }
  }

  return service;
}

export async function fetchNearestEmergencyServices(latitude: number, longitude: number): Promise<EmergencyService[]> {
  try {
    console.log(`Fetching services near [${latitude}, ${longitude}]`);
    const allServices: EmergencyService[] = [];

    // Search for each type of emergency service - one at a time
    for (const [serviceType, placeType] of Object.entries(EMERGENCY_SERVICE_TYPES)) {
      try {
        console.log(`Searching for ${serviceType} places with type: ${placeType}`);
        const places = await searchNearbyPlaces(latitude, longitude, placeType);
        console.log(`Found ${places.length} ${serviceType} places`);
        
        const services = await Promise.all(
          places.map(place => convertToEmergencyService(place, serviceType))
        );
        allServices.push(...services);
      } catch (error) {
        console.error(`Error fetching ${serviceType}:`, error);
        toast.error(`Failed to fetch ${serviceType} locations`);
      }
    }

    // Calculate distances
    const servicesWithDistance = await Promise.all(
      allServices.map(async service => {
        try {
          const roadDistance = await fetchRouteDistance(
            latitude,
            longitude,
            service.latitude,
            service.longitude
          );
          
          return {
            ...service,
            road_distance: roadDistance
          };
        } catch (error) {
          console.warn(`Could not calculate road distance for ${service.name}:`, error);
          return service;
        }
      })
    );

    // Sort services by distance, prioritizing hospitals with emergency rooms
    return servicesWithDistance.sort((a, b) => {
      // If both are hospitals and one has a verified emergency room
      if (a.type.toLowerCase().includes('hospital') && b.type.toLowerCase().includes('hospital')) {
        // If one has verified emergency room and the other doesn't
        if (a.verification?.hasEmergencyRoom && !b.verification?.hasEmergencyRoom) {
          return -1;
        }
        if (!a.verification?.hasEmergencyRoom && b.verification?.hasEmergencyRoom) {
          return 1;
        }
      }
      
      // Sort by road distance
      return (a.road_distance || Infinity) - (b.road_distance || Infinity);
    });
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
