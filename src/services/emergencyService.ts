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

// Define standard service types to ensure consistent grouping
const STANDARD_SERVICE_TYPES = ["Hospital", "EMS", "Fire", "Law Enforcement"];

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
export async function fetchServicesFromEdge(latitude: number, longitude: number): Promise<any[]> {
  try {
    console.log(`Fetching services from edge function for coordinates: [${latitude}, ${longitude}]`);
    const url = `${EDGE_FUNCTION_URL}?lat=${latitude}&lon=${longitude}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch from Edge Function: ${errorText}`);
    }
    
    const json = await response.json();

    if (json.error) {
      throw new Error(json.error?.message || 'Failed to fetch from Edge Function');
    }

    console.log("Raw services data from database:", json.data);
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
      data = await fetchServicesFromEdge(latitude, longitude);
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
    
    // Log the types of services found in the database for debugging
    const typesInDatabase = new Set(data.map(service => service.type));
    console.log("Service types found in database:", Array.from(typesInDatabase));

    const servicesWithDistance = await Promise.all(
      data.map(async service => {
        try {
          // Standardize service type before processing
          const standardType = standardizeServiceType(service.type);
          console.log(`Processing service: ${service.name}, original type: ${service.type}, standard type: ${standardType}`);

          const roadDistance = await fetchRouteDistance(
            latitude,
            longitude,
            service.latitude,
            service.longitude
          );

          const emergencyService: EmergencyService = {
            id: service.id,
            name: service.name,
            type: standardType, // Use standardized type for consistency
            latitude: service.latitude,
            longitude: service.longitude,
            address: service.address || undefined,
            phone: service.phone || undefined,
            hours: service.hours || undefined,
            road_distance: roadDistance || service.distance
          };

          return emergencyService;
        } catch (error) {
          console.warn(`Could not calculate road distance for ${service.name}:`, error);

          return {
            id: service.id,
            name: service.name,
            type: standardizeServiceType(service.type), // Use standardized type for consistency
            latitude: service.latitude,
            longitude: service.longitude,
            address: service.address || undefined,
            phone: service.phone || undefined,
            hours: service.hours || undefined,
            road_distance: service.distance || calculateHaversineDistance(latitude, longitude, service.latitude, service.longitude) * 1.3
          };
        }
      })
    );

    // Filter services by type if specified by the user
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
    
    // Get the closest service of each type
    const closestByType = getClosestServiceByType(filteredServices);
    
    // Log what we found for debugging
    console.log(`Found ${closestByType.length} services (closest of each available type):`);
    closestByType.forEach(service => {
      console.log(`- ${service.type}: ${service.name} (${service.road_distance} km)`);
    });
    
    // Sort the services by distance
    const sortedServices = closestByType.sort((a, b) =>
      (a.road_distance || Infinity) - (b.road_distance || Infinity)
    );
    
    return sortedServices;
  } catch (error) {
    console.error("Error fetching emergency services:", error);
    toast.error("Failed to fetch emergency services. Please try again.");
    return [];
  }
}

// Helper function to get the closest service of each type
function getClosestServiceByType(services: EmergencyService[]): EmergencyService[] {
  if (!services.length) return [];
  
  const servicesByType = new Map<string, EmergencyService>();
  
  // For each service type, find the closest service
  for (const service of services) {
    const existingService = servicesByType.get(service.type);
    
    if (!existingService || 
        (service.road_distance || Infinity) < (existingService.road_distance || Infinity)) {
      servicesByType.set(service.type, service);
    }
  }
  
  return Array.from(servicesByType.values());
}

// Helper function to map service types to standard categories
function standardizeServiceType(type: string): string {
  if (!type) return "Other";
  
  const lowerType = type.toLowerCase();
  
  if (lowerType.includes('hospital')) return 'Hospital';
  if (lowerType.includes('ems') || lowerType.includes('ambulance')) return 'EMS';
  if (lowerType.includes('fire')) return 'Fire';
  if (lowerType.includes('law') || lowerType.includes('police')) return 'Law Enforcement';
  
  // If no match, return the original type
  return type;
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
): Promise<{ points: [number, number][]; distance: number; duration: number; steps?: any[] } | null> {
  return new Promise((resolve) => {
    queueRequest(async () => {
      try {
        console.log("Fetching detailed route from Google Maps API...");
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

// Use Google Maps Directions API to get route with detailed steps
async function getGoogleDirectionsRoute(
  origin: { lat: number, lng: number },
  destination: { lat: number, lng: number }
): Promise<{ points: [number, number][]; distance: number; duration: number; steps: any[] }> {
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
        provideRouteAlternatives: false,
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
          
          // Extract detailed steps with instructions
          const steps = route.legs[0].steps.map(step => ({
            instructions: step.instructions,
            distance: step.distance?.value || 0,
            duration: step.duration?.value || 0,
            startLocation: {
              lat: step.start_location.lat(),
              lng: step.start_location.lng()
            },
            endLocation: {
              lat: step.end_location.lat(),
              lng: step.end_location.lng()
            },
            maneuver: step.maneuver || ''
          }));
          
          console.log("Google Maps returned route with", steps.length, "steps");
          console.log("Sample instruction:", steps.length > 0 ? steps[0].instructions : "No steps");
          
          resolve({
            points,
            distance: distance / 1000, // meters to km
            duration: duration / 60, // seconds to minutes
            steps
          });
        } else {
          console.error("Directions request failed:", status);
          reject(new Error(`Directions request failed: ${status}`));
        }
      }
    );
  });
}
