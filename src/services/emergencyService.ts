
import { toast } from 'sonner';
import { EmergencyService } from '../types/mapTypes';
import { calculateHaversineDistance } from '../utils/mapUtils';

// API Keys and URLs
const GOOGLE_MAPS_API_KEY = "AIzaSyBYXWPdOpB690ph_f9T2ubD9m4fgEqFUl4"; // Using the same key from GoogleMap.tsx
const EDGE_FUNCTION_URL = "https://ljsmrxbbkbleugkpehcl.supabase.co/functions/v1/get-emergency-services";

// === Request Queue for Google Directions API Rate Limiting ===
const requestQueue: (() => Promise<void>)[] = [];
let isProcessingQueue = false;
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 500; // 0.5 second between requests to avoid rate limiting

async function processQueue() {
  if (isProcessingQueue || requestQueue.length === 0) return;

  isProcessingQueue = true;

  while (requestQueue.length > 0) {
    const request = requestQueue.shift();
    if (request) {
      try {
        // Ensure we wait at least MIN_REQUEST_INTERVAL since the last request
        const now = Date.now();
        const timeSinceLastRequest = now - lastRequestTime;
        if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
          await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
        }
        
        // Execute the request
        lastRequestTime = Date.now();
        await request();
      } catch (error) {
        console.error("Error processing queued request:", error);
      }
    }
  }

  isProcessingQueue = false;
}

function queueRequest(request: () => Promise<void>) {
  requestQueue.push(request);
  processQueue();
}

// === Fetch from Supabase Edge Function ===
// Export this function so it can be imported by other modules
export async function fetchServicesFromEdge(): Promise<any[]> {
  try {
    const response = await fetch(EDGE_FUNCTION_URL);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch from Edge Function: ${errorText}`);
    }
    
    const json = await response.json();

    if (json.error) {
      throw new Error(json.error?.message || 'Failed to fetch from Edge Function');
    }

    return json.data || [];
  } catch (err: any) {
    console.error("Edge Function fetch error:", err.message);
    throw err;
  }
}

// === Main Function: Fetch Nearest Emergency Services ===
export async function fetchNearestEmergencyServices(
  latitude: number,
  longitude: number,
  radius: number = 30,
  types?: string[],
  limit?: number
): Promise<EmergencyService[]> {
  try {
    console.log(`Fetching services from Edge Function near [${latitude}, ${longitude}]`);

    let data: any[];
    try {
      data = await fetchServicesFromEdge();
    } catch (error) {
      console.error("Failed to fetch emergency services from edge:", error);
      toast.error("Failed to fetch emergency services from database");
      return [];
    }

    if (!data || data.length === 0) {
      toast.info("No emergency services found in the database");
      return [];
    }

    console.log(`Found ${data.length} services, calculating distances...`);

    const servicesWithDistance = await Promise.all(
      data.map(async service => {
        try {
          const roadDistance = await fetchRouteDistance(
            latitude,
            longitude,
            service.latitude,
            service.longitude
          );

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

    // Filter services by type if specified
    let filteredServices = servicesWithDistance;
    if (types && types.length > 0) {
      filteredServices = filteredServices.filter(service =>
        types.some(type => service.type.toLowerCase().includes(type.toLowerCase()))
      );
    }

    // Filter services by radius
    filteredServices = filteredServices.filter(service =>
      (service.road_distance || Infinity) <= radius
    );

    // Group services by type and get the closest for each type
    const servicesByType = new Map<string, EmergencyService>();
    
    filteredServices.forEach(service => {
      // Create a standardized type key by converting to lowercase and trimming
      const typeKey = service.type.toLowerCase().trim();
      
      // If this type doesn't exist in the map yet, or if this service is closer than the existing one
      if (
        !servicesByType.has(typeKey) || 
        (service.road_distance || Infinity) < (servicesByType.get(typeKey)?.road_distance || Infinity)
      ) {
        servicesByType.set(typeKey, service);
      }
    });

    // Convert the map values back to an array
    const closestByType = Array.from(servicesByType.values());
    
    // Sort the closest services by distance
    const sortedServices = closestByType.sort((a, b) =>
      (a.road_distance || Infinity) - (b.road_distance || Infinity)
    );

    console.log(`Returning ${sortedServices.length} services (closest of each type)`);
    return limit && limit > 0 ? sortedServices.slice(0, limit) : sortedServices;
  } catch (error) {
    console.error("Error fetching emergency services:", error);
    toast.error("Failed to fetch emergency services. Please try again.");
    return [];
  }
}

// === Fetch Route Distance via Google Maps Directions API ===
export async function fetchRouteDistance(
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number
): Promise<number | null> {
  try {
    // Use Google Maps Distance Matrix API
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${startLat},${startLon}&destinations=${endLat},${endLon}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;
    
    // We need to use a proxy or Edge Function as the client-side can't directly call this API
    // For now, we'll simulate the response with the browser's native fetch
    
    // Note: In production, you should route this through a server-side proxy or Edge Function
    // This direct fetch will likely fail due to CORS issues
    const distance = await calculateGoogleRouteDistance(
      { lat: startLat, lng: startLon },
      { lat: endLat, lng: endLon }
    );
    
    return distance / 1000; // Convert meters to kilometers
  } catch (error) {
    console.error("Error calculating route distance:", error);
    return calculateHaversineDistance(startLat, startLon, endLat, endLon) * 1.3;
  }
}

// Use client-side Google Maps API to calculate distance
// This works because you already loaded the Google Maps JavaScript API
async function calculateGoogleRouteDistance(
  origin: { lat: number, lng: number },
  destination: { lat: number, lng: number }
): Promise<number> {
  return new Promise((resolve, reject) => {
    // Ensure Google Maps API is loaded
    if (!window.google || !window.google.maps) {
      console.error("Google Maps API not loaded");
      reject(new Error("Google Maps API not loaded"));
      return;
    }

    const service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
      {
        origins: [origin],
        destinations: [destination],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
      },
      (response, status) => {
        if (status === google.maps.DistanceMatrixStatus.OK && response) {
          const distance = response.rows[0].elements[0].distance.value;
          resolve(distance);
        } else {
          console.error("Distance Matrix failed:", status);
          reject(new Error(`Distance Matrix failed: ${status}`));
        }
      }
    );
  });
}

// === Fetch Route Path with Waypoints (Google Maps) ===
export async function fetchRoutePath(
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number
): Promise<{ points: [number, number][]; distance: number; duration: number } | null> {
  return new Promise((resolve) => {
    queueRequest(async () => {
      try {
        const result = await getGoogleDirectionsRoute(
          { lat: startLat, lng: startLon },
          { lat: endLat, lng: endLon }
        );
        
        resolve(result);
      } catch (error) {
        console.error("Error fetching route path:", error);
        const fallbackPoints: [number, number][] = [
          [startLat, startLon],
          [endLat, endLon]
        ];
        const distance = calculateHaversineDistance(startLat, startLon, endLat, endLon);
        resolve({
          points: fallbackPoints,
          distance,
          duration: distance / 50 * 60
        });
      }
    });
  });
}

// Use Google Maps Directions API to get route
async function getGoogleDirectionsRoute(
  origin: { lat: number, lng: number },
  destination: { lat: number, lng: number }
): Promise<{ points: [number, number][]; distance: number; duration: number }> {
  return new Promise((resolve, reject) => {
    // Ensure Google Maps API is loaded
    if (!window.google || !window.google.maps) {
      console.error("Google Maps API not loaded");
      reject(new Error("Google Maps API not loaded"));
      return;
    }

    const directionsService = new google.maps.DirectionsService();
    directionsService.route(
      {
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          // Extract path points from the result
          const route = result.routes[0];
          const path = route.overview_path;
          
          const points: [number, number][] = path.map(point => 
            [point.lat(), point.lng()] as [number, number]
          );
          
          const distance = route.legs[0].distance?.value || 0;
          const duration = route.legs[0].duration?.value || 0;
          
          resolve({
            points,
            distance: distance / 1000, // meters to km
            duration: duration / 60 // seconds to minutes
          });
        } else {
          console.error("Directions request failed:", status);
          reject(new Error(`Directions request failed: ${status}`));
        }
      }
    );
  });
}
