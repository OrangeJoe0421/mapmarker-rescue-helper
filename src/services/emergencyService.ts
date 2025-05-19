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

    // Use PostGIS geography type for accurate distance calculation on the ellipsoid
    query = query.rpc('nearby_emergency_services', {
      input_lat: latitude,
      input_lng: longitude,
      radius_km: radiusInKm
    });

    // Apply type filter if provided
    if (types && types.length > 0) {
      query = query.in('type', types);
    }

    const { data, error } = await query;

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
