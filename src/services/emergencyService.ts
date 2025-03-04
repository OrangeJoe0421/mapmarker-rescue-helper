
import { toast } from 'sonner';
import { EmergencyService } from '../store/useMapStore';

const API_BASE_URL = "https://mocki.io/v1/d1f16339-9915-4722-aa6a-0aacd4e08091"; // Mock API endpoint

export async function fetchNearestEmergencyServices(latitude: number, longitude: number): Promise<EmergencyService[]> {
  try {
    // For demonstration, we'll use a mock API that returns simulated data
    // In a real application, you would call your actual backend API
    const response = await fetch(`${API_BASE_URL}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Simulate calculating distance from user location
    const services = data.map((service: any) => ({
      ...service,
      road_distance: calculateHaversineDistance(
        latitude,
        longitude,
        service.latitude,
        service.longitude
      )
    }));
    
    // Sort by distance
    return services.sort((a: EmergencyService, b: EmergencyService) => 
      (a.road_distance || Infinity) - (b.road_distance || Infinity)
    );
  } catch (error) {
    console.error("Error fetching emergency services:", error);
    toast.error("Failed to fetch emergency services. Please try again.");
    return [];
  }
}

// Calculate the Haversine distance between two points
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return parseFloat(distance.toFixed(2));
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

// In a real application, you would implement actual routing API integration here
export async function fetchRouteDistance(
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number
): Promise<number | null> {
  try {
    // For a real implementation, you would call OSRM, Google Maps, or another routing API
    // For example with OSRM:
    // const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=false`);
    
    // For now, we'll just return the Haversine distance with a multiplier to simulate road distance
    return calculateHaversineDistance(startLat, startLon, endLat, endLon) * 1.3;
  } catch (error) {
    console.error("Error calculating route distance:", error);
    return null;
  }
}
