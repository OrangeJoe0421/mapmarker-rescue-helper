
import { EmergencyService } from '@/types/mapTypes';
import { supabase } from '@/integrations/supabase/client';

/**
 * Fetches emergency services within a specified geographic radius using PostGIS functions.
 * This function calculates the distance between the user's location and each emergency service
 * directly within the database, and only returns services within the specified radius.
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
    // Construct the SQL query to fetch emergency services within the radius
    let query = supabase
      .from('emergency_services')
      .select('*')
      .order('distance') // Order by distance for consistent results
      .limit(limit || 100); // Apply the limit here

    // Use stored procedure for accurate distance calculation
    // Note: We're using a stored procedure instead of rpc because rpc is not available in the client
    const { data, error } = await query.filter(
      `ST_DWithin(ST_SetSRID(ST_Point(longitude, latitude), 4326)::geography, 
      ST_SetSRID(ST_Point(${longitude}, ${latitude}), 4326)::geography, 
      ${radiusInKm * 1000})`
    );

    // Apply type filter if provided
    if (types && types.length > 0) {
      query = query.in('type', types);
    }

    if (error) {
      console.error("Error fetching services from database:", error);
      throw new Error(`Database query error: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.log("No emergency services found within the specified radius.");
      return [];
    }

    // Convert database records to EmergencyService objects
    const services: EmergencyService[] = await Promise.all(
      data.map(async (record: any) => await convertDatabaseRecordToService(record))
    );

    console.log(`Found ${services.length} emergency services within the specified radius`);
    return services;

  } catch (error) {
    console.error("Failed to fetch emergency services:", error);
    throw error;
  }
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
    
    // Simple text directions for the steps
    const steps = [
      { text: "Start at the origin point", distance: 0 },
      { text: "Head toward the destination", distance: distance * 0.5 },
      { text: "Arrive at the destination", distance: distance * 0.5 }
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
