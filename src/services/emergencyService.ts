import { toast } from 'sonner';
import { EmergencyService } from '../types/mapTypes';
import { calculateHaversineDistance } from '../utils/mapUtils';
import { fetchEmergencyServicesWithinRadius } from '../utils/supabaseHelpers';
import { supabase } from '@/integrations/supabase/client';

// API Keys and URLs
const GOOGLE_MAPS_API_KEY = "AIzaSyBYXWPdOpB690ph_f9T2ubD9m4fgEqFUl4"; // Using the same key from GoogleMap.tsx

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

// === Fetch directly from Supabase database with geographic filtering ===
// Export this function so it can be imported by other modules
export async function fetchServicesFromDatabase(latitude: number, longitude: number, radiusKm: number = 30): Promise<any[]> {
  console.log(`Fetching filtered services from database for coordinates: [${latitude}, ${longitude}] within ${radiusKm}km`);
  
  try {
    // Use the new helper function that applies geographic filtering
    return await fetchEmergencyServicesWithinRadius(latitude, longitude, radiusKm);
  } catch (err: any) {
    console.error("Database fetch error:", err.message);
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
    console.log(`Fetching services from database near [${latitude}, ${longitude}] within ${radius}km`);

    let data: any[];
    try {
      // Use the geographically filtered fetch
      data = await fetchServicesFromDatabase(latitude, longitude, radius);
    } catch (error) {
      console.error("Failed to fetch emergency services from database:", error);
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

    // Further refine results by calculating exact distances
    const servicesWithDistance = await Promise.all(
      data.map(async service => {
        try {
          // Standardize service type before processing
          const standardType = standardizeServiceType(service.type);
          
          // Calculate approximate distance using haversine (as crow flies)
          const haversineDistance = calculateHaversineDistance(
            latitude, 
            longitude, 
            service.latitude, 
            service.longitude
          );
          
          // Estimate road distance as 1.3x the haversine distance
          // We're removing the Distance Matrix API call since it's redundant
          const roadDistance = haversineDistance * 1.3; 

          // Create verification object if verification data exists
          const verification = service.has_emergency_room !== null || service.verified_at ? {
            hasEmergencyRoom: service.has_emergency_room || false,
            verifiedAt: service.verified_at || null
          } : undefined;

          const emergencyService: EmergencyService = {
            id: service.id,
            name: service.name,
            type: standardType, // Use standardized type for consistency
            latitude: service.latitude,
            longitude: service.longitude,
            address: service.address || undefined,
            phone: service.phone || undefined,
            hours: service.hours || undefined,
            road_distance: roadDistance,
            verification: verification
          };

          return emergencyService;
        } catch (error) {
          console.warn(`Could not process service ${service.name}:`, error);

          // Create verification object if verification data exists
          const verification = service.has_emergency_room !== null || service.verified_at ? {
            hasEmergencyRoom: service.has_emergency_room || false,
            verifiedAt: service.verified_at || null
          } : undefined;

          return {
            id: service.id,
            name: service.name,
            type: standardizeServiceType(service.type),
            latitude: service.latitude,
            longitude: service.longitude,
            address: service.address || undefined,
            phone: service.phone || undefined,
            hours: service.hours || undefined,
            road_distance: calculateHaversineDistance(latitude, longitude, service.latitude, service.longitude) * 1.3,
            verification: verification
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
// Remove the fetchRouteDistance function that used the Distance Matrix API
// and replace it with a simpler version that just uses haversine distance

export async function fetchRouteDistance(
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number
): Promise<number | null> {
  // Simply use haversine distance with a road factor multiplier
  // This avoids using the Distance Matrix API which was causing REQUEST_DENIED errors
  try {
    const haversineDistance = calculateHaversineDistance(startLat, startLon, endLat, endLon);
    // Apply a typical road factor of 1.3 to approximate road distance
    return haversineDistance * 1.3;
  } catch (error) {
    console.error("Error calculating route distance:", error);
    return null;
  }
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
        console.info(`Fetching route path from [${startLat}, ${startLon}] to [${endLat}, ${endLon}]`);
        const result = await getGoogleDirectionsRoute(
          { lat: startLat, lng: startLon },
          { lat: endLat, lng: endLon }
        );
        
        if (result.steps && result.steps.length > 0) {
          console.info(`Retrieved detailed directions with ${result.steps.length} steps`);
        } else {
          console.warn("No detailed direction steps returned from Google Maps API");
        }
        
        resolve(result);
      } catch (error) {
        console.error("Error fetching route path:", error);
        console.warn("Using fallback straight-line route due to Google Maps API error");
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

    console.info(`Requesting directions from Google Maps API: [${origin.lat}, ${origin.lng}] to [${destination.lat}, ${destination.lng}]`);
    const directionsService = new google.maps.DirectionsService();
    directionsService.route(
      {
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        console.info(`Google Maps Directions API status: ${status}`);
        
        if (status === google.maps.DirectionsStatus.OK && result) {
          // Log full route object to inspect structure
          console.info("Google Maps route result:", result);
          
          // Extract path points from the result
          const route = result.routes[0];
          const path = route.overview_path;
          
          const points: [number, number][] = path.map(point => 
            [point.lat(), point.lng()] as [number, number]
          );
          
          const distance = route.legs[0].distance?.value || 0;
          const duration = route.legs[0].duration?.value || 0;
          
          // Check if we have legs with steps
          if (!route.legs || !route.legs[0] || !route.legs[0].steps || route.legs[0].steps.length === 0) {
            console.warn("Google Maps returned route without steps");
            reject(new Error("No steps in Google Maps response"));
            return;
          }
          
          // Extract detailed steps with instructions, making sure to preserve HTML instructions
          const steps = route.legs[0].steps.map(step => {
            // Log each step to inspect content
            console.debug("Step details:", {
              instructions: step.instructions,
              distance: step.distance?.value,
              maneuver: step.maneuver
            });
            
            return {
              instructions: step.instructions, // This contains HTML formatted instructions
              plainInstructions: step.instructions.replace(/<\/?[^>]+(>|$)/g, "").replace(/&nbsp;/g, " "), // Plain text version
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
            };
          });
          
          console.info(`Google Maps returned route with ${steps.length} steps`);
          // Log first few steps to debug instructions content
          if (steps.length > 0) {
            console.debug("Sample step instructions:", steps.slice(0, 2));
          }
          
          resolve({
            points,
            distance: distance / 1000, // meters to km
            duration: duration / 60, // seconds to minutes
            steps
          });
        } else {
          console.error(`Directions request failed: ${status}`);
          // Log detailed error information based on status
          switch (status) {
            case google.maps.DirectionsStatus.ZERO_RESULTS:
              console.error("No route could be found between the origin and destination.");
              break;
            case google.maps.DirectionsStatus.MAX_WAYPOINTS_EXCEEDED:
              console.error("Too many waypoints were provided.");
              break;
            case google.maps.DirectionsStatus.INVALID_REQUEST:
              console.error("Invalid request - may have missing required fields.");
              break;
            case google.maps.DirectionsStatus.OVER_QUERY_LIMIT:
              console.error("API quota exceeded - check your Google Maps API billing and usage limits.");
              break;
            case google.maps.DirectionsStatus.REQUEST_DENIED:
              console.error("Request denied - the API key may be missing or invalid, or the service may not be enabled.");
              break;
            case google.maps.DirectionsStatus.UNKNOWN_ERROR:
              console.error("Unknown server error - try again later.");
              break;
          }
          reject(new Error(`Directions request failed: ${status}`));
        }
      }
    );
  });
}
