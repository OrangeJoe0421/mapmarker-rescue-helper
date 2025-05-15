
import { toast } from 'sonner';
import { EmergencyService } from '../types/mapTypes';
import { calculateHaversineDistance } from '../utils/mapUtils';

const OSRM_API_URL = "https://router.project-osrm.org/route/v1/driving/";
const EDGE_FUNCTION_URL = "https://ljsmrxbbkbleugkpehcl.supabase.co/functions/v1/get-emergency-services";

// === Request Queue for OSRM Rate Limiting ===
const requestQueue: (() => Promise<void>)[] = [];
let isProcessingQueue = false;

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
      await new Promise(resolve => setTimeout(resolve, 1200));
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

    let filteredServices = servicesWithDistance;

    if (types && types.length > 0) {
      filteredServices = filteredServices.filter(service =>
        types.some(type => service.type.toLowerCase().includes(type.toLowerCase()))
      );
    }

    filteredServices = filteredServices.filter(service =>
      (service.road_distance || Infinity) <= radius
    );

    const sortedServices = filteredServices.sort((a, b) =>
      (a.road_distance || Infinity) - (b.road_distance || Infinity)
    );

    return limit && limit > 0 ? sortedServices.slice(0, limit) : sortedServices;
  } catch (error) {
    console.error("Error fetching emergency services:", error);
    toast.error("Failed to fetch emergency services. Please try again.");
    return [];
  }
}

// === Fetch Route Distance via OSRM API ===
export async function fetchRouteDistance(
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number
): Promise<number | null> {
  try {
    const coordinates = `${startLon},${startLat};${endLon},${endLat}`;
    const url = `${OSRM_API_URL}${coordinates}?overview=full`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`OSRM API error: ${response.status}`);

    const data = await response.json();
    if (data.code !== 'Ok' || !data.routes?.length) throw new Error('No route found');

    return parseFloat((data.routes[0].distance / 1000).toFixed(2)); // meters → km
  } catch (error) {
    console.error("Error calculating route distance:", error);
    return calculateHaversineDistance(startLat, startLon, endLat, endLon) * 1.3;
  }
}

// === Fetch Route Path with Waypoints (Leaflet) ===
export async function fetchRoutePath(
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number
): Promise<{ points: [number, number][]; distance: number; duration: number } | null> {
  return new Promise((resolve) => {
    queueRequest(async () => {
      try {
        const coordinates = `${startLon},${startLat};${endLon},${endLat}`;
        const url = `${OSRM_API_URL}${coordinates}?overview=full&geometries=geojson`;

        console.log("Fetching route path:", url);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`OSRM API error: ${response.status}`);

        const data = await response.json();
        if (data.code !== 'Ok' || !data.routes?.length) throw new Error('No route found');

        const route = data.routes[0];
        const points = route.geometry.coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
        );

        resolve({
          points,
          distance: route.distance / 1000,
          duration: route.duration / 60
        });
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
