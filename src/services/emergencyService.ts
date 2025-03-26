
import { toast } from 'sonner';
import { EmergencyService } from '../types/mapTypes';
import { getAllEmsData, getEmsDataWithinRadius } from './sampleDataService';
import { calculateHaversineDistance } from '../utils/mapUtils';
import * as route from '@arcgis/core/rest/route';
import RouteParameters from '@arcgis/core/rest/support/RouteParameters';
import FeatureSet from '@arcgis/core/rest/support/FeatureSet';
import Point from '@arcgis/core/geometry/Point';
import Stop from '@arcgis/core/rest/support/Stop';
import Polyline from '@arcgis/core/geometry/Polyline';

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
          const routeInfo = await fetchRouteWithDirections(
            latitude,
            longitude,
            service.latitude,
            service.longitude
          );
          
          if (routeInfo?.distance) {
            // Update the service with the road distance
            service.road_distance = routeInfo.distance;
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

// Use ArcGIS routing service for better route data
export async function fetchRouteWithDirections(
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number
): Promise<{ 
  points: [number, number][]; 
  distance: number; 
  duration: number;
  directions?: Array<{
    text: string;
    distance: number;
    time: number;
  }>;
} | null> {
  try {
    // Set up the routing service URL - using ArcGIS World Route service
    const routeUrl = "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World";
    
    // Create starting and ending points
    const startPoint = new Point({
      longitude: startLon,
      latitude: startLat
    });
    
    const endPoint = new Point({
      longitude: endLon,
      latitude: endLat
    });
    
    // Create stops for the route
    const stops = new FeatureSet();
    
    // Fixed: Remove attributes which doesn't exist in StopProperties
    const startStop = new Stop({
      geometry: startPoint
    });
    
    const endStop = new Stop({
      geometry: endPoint
    });
    
    // Type assertion to work around strict typing
    stops.features = [startStop as any, endStop as any];
    
    // Set up route parameters
    const routeParams = new RouteParameters({
      stops: stops,
      returnDirections: true,
      directionsLanguage: "en",
      returnRoutes: true,
      returnStops: true,
      outSpatialReference: { wkid: 4326 }
    });
    
    // Make the route request
    try {
      const result = await route.solve(routeUrl, routeParams);
      
      if (!result || !result.routeResults || result.routeResults.length === 0) {
        throw new Error('No route found');
      }
      
      const routeResult = result.routeResults[0].route;
      const geometry = routeResult.geometry;
      
      // Fixed: Check if geometry is a Polyline before accessing paths
      if (!(geometry instanceof Polyline)) {
        throw new Error('Unexpected geometry type');
      }
      
      // Extract path coordinates
      const points = geometry.paths[0].map(coord => {
        // ArcGIS returns [lng, lat], but we need [lat, lng] for leaflet
        return [coord[1], coord[0]] as [number, number];
      });
      
      // Extract distance and time
      const distance = parseFloat((routeResult.attributes.Total_Kilometers || 0).toFixed(2));
      const duration = parseFloat((routeResult.attributes.Total_Minutes || 0).toFixed(2)) * 60; // Convert to seconds
      
      // Extract directions if available
      let directions = undefined;
      
      // Fixed: Check if directionsFeatures exists before trying to extract directions
      if (result.routeResults[0].directions && 
          result.routeResults[0].directions.features) {
        directions = result.routeResults[0].directions.features.map(feature => {
          return {
            text: feature.attributes.text,
            distance: feature.attributes.length,
            time: feature.attributes.time
          };
        });
      }
      
      return {
        points,
        distance,
        duration,
        directions
      };
    } catch (arcgisError) {
      console.error("ArcGIS routing error:", arcgisError);
      // Fall back to OSRM if ArcGIS fails
      return fetchOSRMRoute(startLat, startLon, endLat, endLon);
    }
  } catch (error) {
    console.error("Error in route calculation:", error);
    // Use OSRM as a fallback
    return fetchOSRMRoute(startLat, startLon, endLat, endLon);
  }
}

// Original OSRM API for routing (used as fallback)
const OSRM_API_URL = "https://router.project-osrm.org/route/v1/driving/";

// Use OSRM API to get route as fallback
export async function fetchOSRMRoute(
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number
): Promise<{ points: [number, number][]; distance: number; duration: number } | null> {
  try {
    // Format coordinates for OSRM API
    const coordinates = `${startLon},${startLat};${endLon},${endLat}`;
    const url = `${OSRM_API_URL}${coordinates}?overview=full&geometries=geojson`;
    
    console.log("Fetching route path (OSRM fallback):", url);
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
    
    return {
      points,
      distance: route.distance / 1000, // convert meters to kilometers
      duration: route.duration, // seconds
    };
  } catch (error) {
    console.error("Error fetching route path:", error);
    
    // Create a fallback route with just start and end points
    console.log("Using fallback route calculation");
    const fallbackPoints: [number, number][] = [
      [startLat, startLon],
      [endLat, endLon]
    ];
    
    const distance = calculateHaversineDistance(startLat, startLon, endLat, endLon);
    return {
      points: fallbackPoints,
      distance: distance,
      duration: distance / 50 * 60 // Rough estimate: 50 km/h average speed
    };
  }
}

