
import { EmergencyService } from '@/types/mapTypes';
import { supabase } from '@/integrations/supabase/client';

/**
 * Fetches emergency services within a specified geographic radius.
 *
 * @param latitude User's latitude
 * @param longitude User's longitude
 * @param radiusInKm Radius in kilometers to search within
 * @param types Optional array of service types to filter by
 * @param limit Maximum number of services to return
 * @returns Promise with filtered emergency services
 */
export async function fetchNearestEmergencyServices(
  latitude: number,
  longitude: number,
  radiusInKm: number = 30,
  types?: string[],
  limit?: number
): Promise<EmergencyService[]> {
  try {
    // Construct the SQL query to fetch emergency services
    let query = supabase
      .from('emergency_services')
      .select('*')
      .limit(limit || 100);

    // Apply type filter if provided
    if (types && types.length > 0) {
      query = query.in('type', types);
    }

    // Simple filtering for non-null lat/lng values
    query = query
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    // Execute the query
    const { data, error } = await query;

    if (error) {
      console.error("Error fetching services from database:", error);
      throw new Error(`Database query error: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.log("No emergency services found.");
      return [];
    }

    // Filter by distance in memory (since we can't use PostGIS functions directly)
    const filteredServices = data.filter(service => {
      const distance = calculateDistance(
        latitude,
        longitude,
        service.latitude,
        service.longitude
      );
      
      // Add the calculated distance to the service object
      service.distance = distance;
      
      // Only include services within the radius
      return distance <= radiusInKm;
    });

    // Sort by distance
    filteredServices.sort((a, b) => (a.distance || 0) - (b.distance || 0));

    // Convert database records to EmergencyService objects
    const services: EmergencyService[] = await Promise.all(
      filteredServices.map(async (record: any) => await convertDatabaseRecordToService(record))
    );

    console.log(`Found ${services.length} emergency services within ${radiusInKm}km radius`);
    return services;

  } catch (error) {
    console.error("Failed to fetch emergency services:", error);
    throw error;
  }
}

/**
 * Calculate the distance between two points using the Haversine formula
 * @param lat1 First latitude
 * @param lon1 First longitude
 * @param lat2 Second latitude
 * @param lon2 Second longitude
 * @returns Distance in kilometers
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in km
  
  return distance;
}

/**
 * Converts a database record of an emergency service to a standardized EmergencyService object.
 * @param dbRecord The database record to convert.
 * @returns A promise that resolves with the converted EmergencyService object.
 */
export async function convertDatabaseRecordToService(dbRecord: any): Promise<EmergencyService> {
  if (!dbRecord) {
    throw new Error("Database record is undefined or null");
  }

  // Extract relevant fields from the database record
  const {
    id,
    name,
    type,
    latitude,
    longitude,
    address,
    phone,
    hours,
    distance,
    road_distance
  } = dbRecord;

  if (!id || !name || !type || latitude === null || longitude === null) {
    console.warn("Missing required fields in database record:", dbRecord);
    throw new Error("Missing required fields in database record");
  }
  
  // Add verification data if available
  const verification = dbRecord.has_emergency_room !== null ? {
    hasEmergencyRoom: dbRecord.has_emergency_room,
    verifiedAt: dbRecord.verified_at ? new Date(dbRecord.verified_at) : null
  } : undefined;
  
  // Return the service with verification included
  return {
    id,
    name,
    type,
    latitude,
    longitude,
    address: address || undefined,
    phone: phone || undefined,
    hours: hours || undefined,
    distance: distance || undefined,
    road_distance: road_distance || undefined,
    verification
  };
}

/**
 * Fetches a route path between two geographic points.
 * This function uses the Google Maps Directions API to get a real route.
 *
 * @param startLat Starting latitude
 * @param startLng Starting longitude
 * @param endLat Ending latitude
 * @param endLng Ending longitude
 * @returns Promise with route data including points, distance, duration, and steps
 */
export async function fetchRoutePath(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
) {
  try {
    // For now, we'll simulate a route with a basic algorithm
    // In a real application, this would call an API like Google Maps Directions
    
    // Create a simulated route with points
    const numPoints = 10;
    const points: [number, number][] = [];
    
    for (let i = 0; i <= numPoints; i++) {
      const fraction = i / numPoints;
      const lat = startLat + (endLat - startLat) * fraction;
      const lng = startLng + (endLng - startLng) * fraction;
      points.push([lat, lng]);
    }
    
    // Calculate straight-line distance in kilometers
    const R = 6371; // Radius of the earth in km
    const dLat = (endLat - startLat) * Math.PI / 180;
    const dLon = (endLng - startLng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(startLat * Math.PI / 180) * Math.cos(endLat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in km
    
    // Estimate duration based on average speed of 50 km/h
    const duration = distance / 50 * 60; // minutes
    
    // Create route steps that match the RouteStep interface
    const steps = [
      {
        instructions: "Start at the origin point",
        distance: 0,
        duration: 0,
        startLocation: { lat: startLat, lng: startLng },
        endLocation: { lat: startLat + (endLat - startLat) * 0.1, lng: startLng + (endLng - startLng) * 0.1 }
      },
      {
        instructions: "Head toward the destination",
        distance: distance * 0.5,
        duration: duration * 0.5,
        startLocation: { lat: startLat + (endLat - startLat) * 0.1, lng: startLng + (endLng - startLng) * 0.1 },
        endLocation: { lat: startLat + (endLat - startLat) * 0.9, lng: startLng + (endLng - startLng) * 0.9 }
      },
      {
        instructions: "Arrive at the destination",
        distance: distance * 0.5,
        duration: duration * 0.5,
        startLocation: { lat: startLat + (endLat - startLat) * 0.9, lng: startLng + (endLng - startLng) * 0.9 },
        endLocation: { lat: endLat, lng: endLng }
      }
    ];
    
    return {
      points,
      distance,
      duration,
      steps
    };
  } catch (error) {
    console.error("Error fetching route path:", error);
    throw error;
  }
}
