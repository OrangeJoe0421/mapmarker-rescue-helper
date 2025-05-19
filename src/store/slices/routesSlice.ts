
import { toast } from 'sonner';
import { StateCreator } from 'zustand';
import { Route, RoutePoint, EmergencyService } from '@/types/mapTypes';
import { calculateHaversineDistance } from '@/utils/mapUtils';
import { fetchRoutePath } from '@/services/emergencyService';
import { mapCaptureService } from '@/components/MapCapture';

export interface RoutesState {
  routes: Route[];
  
  // Actions
  calculateRoute: (fromId: string, toUserLocation: boolean, toHospitalId?: string) => Promise<void>;
  calculateRoutesForAllEMS: () => Promise<void>;
  clearRoutes: () => void;
}

export const createRoutesSlice: StateCreator<
  RoutesState & { 
    userLocation?: any; 
    customMarkers?: any[];
    emergencyServices?: any[];
  }
> = (set, get) => ({
  routes: [],

  calculateRoute: async (fromId, toUserLocation, toHospitalId) => {
    const state = get();
    
    // Validate necessary data
    if (toUserLocation && !state.userLocation) {
      toast.error('Please set a user location first by searching for coordinates');
      return;
    }
    
    // Find the source - it could be either a custom marker or an emergency service
    let sourceMarker = state.customMarkers?.find(marker => marker.id === fromId);
    
    if (!sourceMarker) {
      // If not found in custom markers, check emergency services
      sourceMarker = state.emergencyServices?.find(service => service.id === fromId);
    }
    
    if (!sourceMarker) {
      toast.error('Source marker not found');
      return;
    }

    // If routing to a hospital, find the destination hospital
    let destinationMarker;
    if (toHospitalId) {
      destinationMarker = state.emergencyServices?.find(service => service.id === toHospitalId);
      if (!destinationMarker) {
        toast.error('Destination hospital not found');
        return;
      }
    }
    
    const destination = toUserLocation ? state.userLocation : destinationMarker;
    
    if (!destination) {
      toast.error('Destination not set');
      return;
    }
    
    // Clear any existing routes with this source to avoid clutter
    set(state => ({
      routes: state.routes.filter(route => route.fromId !== fromId)
    }));
    
    // Mark any existing captures as stale immediately when calculating a new route
    mapCaptureService.markCaptureStaleDueToRouteChange();
    console.info('Calculating new route, marking capture as stale');

    toast.info('Calculating route using Google Maps...');

    try {
      // Get start and end coordinates
      const startCoords = {
        latitude: sourceMarker.latitude,
        longitude: sourceMarker.longitude
      };
      
      const endCoords = { 
        latitude: destination.latitude, 
        longitude: destination.longitude 
      };
      
      console.info(`Fetching route from [${startCoords.latitude}, ${startCoords.longitude}] to [${endCoords.latitude}, ${endCoords.longitude}]`);
      
      // Call the Google Maps routing service to get a real route
      const routeData = await fetchRoutePath(
        startCoords.latitude,
        startCoords.longitude,
        endCoords.latitude,
        endCoords.longitude
      );
      
      if (!routeData) {
        throw new Error("Could not calculate route");
      }
      
      // Create route points from the fetched route
      const routePoints: RoutePoint[] = routeData.points.map(point => ({
        latitude: point[0],
        longitude: point[1]
      }));
      
      // Create a unique ID for the route that includes a timestamp
      const routeId = `route-${Date.now()}`;
      console.info(`Created new route with ID: ${routeId}, points: ${routePoints.length}`);
      
      // Create the route object with steps if available
      const newRoute: Route = {
        id: routeId,
        points: routePoints,
        fromId: sourceMarker.id,
        toId: toHospitalId || null,
        distance: routeData.distance,
        duration: routeData.duration,
        steps: routeData.steps // Include the step-by-step directions
      };
      
      // Add the route to state
      set((state) => ({
        routes: [...state.routes, newRoute]
      }));
      
      toast.success(`Route calculated: ${routeData.distance.toFixed(2)} km (${Math.ceil(routeData.duration)} min)`);
    } catch (error) {
      console.error("Error calculating route:", error);
      
      // Fallback to simple straight line if API fails
      const startPoint: RoutePoint = {
        latitude: sourceMarker.latitude,
        longitude: sourceMarker.longitude
      };
      
      const endPoint: RoutePoint = toUserLocation 
        ? { latitude: state.userLocation!.latitude, longitude: state.userLocation!.longitude }
        : { latitude: 0, longitude: 0 };
      
      // Create a simple route with just start and end points
      const routePoints = [startPoint];
      
      // Add some intermediate points for visualization
      const steps = 5;
      for (let i = 1; i < steps; i++) {
        routePoints.push({
          latitude: startPoint.latitude + (endPoint.latitude - startPoint.latitude) * (i / steps),
          longitude: startPoint.longitude + (endPoint.longitude - startPoint.longitude) * (i / steps)
        });
      }
      
      routePoints.push(endPoint);
      
      // Calculate a simulated distance
      const distance = calculateHaversineDistance(
        startPoint.latitude,
        startPoint.longitude,
        endPoint.latitude,
        endPoint.longitude
      );
      
      const routeId = `route-${Date.now()}`;
      const newRoute: Route = {
        id: routeId,
        points: routePoints,
        fromId: sourceMarker.id,
        toId: toUserLocation ? null : "destination-id",
        distance: distance,
        duration: distance / 50 * 60 // Rough estimate: 50 km/h average speed
      };
      
      // Add the route to state
      set((state) => ({
        routes: [...state.routes, newRoute]
      }));
      
      toast.warning(`Using simplified route (API failed): ${distance.toFixed(2)} km`);
    }
  },
  
  calculateRoutesForAllEMS: async () => {
    const state = get();
    
    // Validate necessary data
    if (!state.userLocation) {
      toast.error('Please set a user location first by searching for coordinates');
      return;
    }
    
    if (!state.emergencyServices || state.emergencyServices.length === 0) {
      toast.error('No emergency services found to route');
      return;
    }
    
    // Clear all existing routes first
    set({ routes: [] });
    
    // Mark any existing captures as stale
    mapCaptureService.markCaptureStaleDueToRouteChange();
    
    // Filter to only include hospital services
    const hospitalsToRoute = state.emergencyServices.filter(service => 
      service.type.toLowerCase().includes('hospital')
    );
    
    if (hospitalsToRoute.length === 0) {
      toast.warning('No hospitals found to route');
      return;
    }
    
    toast.info(`Calculating routes for ${hospitalsToRoute.length} hospitals...`);
    
    // Calculate routes for hospitals only
    let successCount = 0;
    
    for (const service of hospitalsToRoute) {
      try {
        // Get start and end coordinates
        const startCoords = {
          latitude: service.latitude,
          longitude: service.longitude
        };
        
        const endCoords = { 
          latitude: state.userLocation.latitude, 
          longitude: state.userLocation.longitude 
        };
        
        // Call the enhanced routing service to get a real route
        const routeData = await fetchRoutePath(
          startCoords.latitude,
          startCoords.longitude,
          endCoords.latitude,
          endCoords.longitude
        );
        
        if (!routeData) {
          throw new Error(`Could not calculate route for ${service.name}`);
        }
        
        // Create route points from the fetched route
        const routePoints: RoutePoint[] = routeData.points.map(point => ({
          latitude: point[0],
          longitude: point[1]
        }));
        
        // Create a unique ID for the route
        const routeId = `route-${service.id}-${Date.now()}`;
        
        // Create the route object
        const newRoute: Route = {
          id: routeId,
          points: routePoints,
          fromId: service.id,
          toId: null, // null when destination is user location
          distance: routeData.distance,
          duration: routeData.duration
        };
        
        // Add the route to state
        set((state) => ({
          routes: [...state.routes, newRoute]
        }));
        
        successCount++;
      } catch (error) {
        console.error(`Error calculating route for ${service.name}:`, error);
        // Continue with other services even if one fails
      }
    }
    
    if (successCount > 0) {
      toast.success(`Successfully calculated routes for ${successCount} hospitals`);
    } else {
      toast.error('Failed to calculate any routes');
    }
  },
  
  clearRoutes: () => {
    console.log("Clearing all routes from state");
    set({ routes: [] });
    toast.info('All routes cleared');
    // Also clear any capture when routes are cleared
    mapCaptureService.clearCapture();
    
    // Make sure to mark capture as stale
    mapCaptureService.markCaptureStaleDueToRouteChange();
  },
});
