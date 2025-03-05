
import { toast } from 'sonner';
import { StateCreator } from 'zustand';
import { Route, RoutePoint } from '@/types/mapTypes';
import { calculateHaversineDistance } from '@/utils/mapUtils';
import { fetchRoutePath } from '@/services/emergencyService';

export interface RoutesState {
  routes: Route[];
  
  // Actions
  calculateRoute: (fromId: string, toUserLocation: boolean) => Promise<void>;
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

  calculateRoute: async (fromId, toUserLocation) => {
    const state = get();
    
    // Validate necessary data
    if (toUserLocation && !state.userLocation) {
      toast.error('Please set a user location first');
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

    const destination = toUserLocation ? state.userLocation : null;
    
    if (!destination && !toUserLocation) {
      toast.error('Destination not set');
      return;
    }

    toast.info('Calculating route...');

    try {
      // Get start and end coordinates
      const startCoords = {
        latitude: sourceMarker.latitude,
        longitude: sourceMarker.longitude
      };
      
      const endCoords = toUserLocation 
        ? { latitude: state.userLocation!.latitude, longitude: state.userLocation!.longitude }
        : { latitude: 0, longitude: 0 }; // Will be replaced with actual destination
      
      // Call the enhanced routing service to get a real route
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
      
      // Create a unique ID for the route
      const routeId = `route-${Date.now()}`;
      
      // Create the route object
      const newRoute: Route = {
        id: routeId,
        points: routePoints,
        fromId: sourceMarker.id,
        toId: toUserLocation ? null : "destination-id",
        distance: routeData.distance,
        duration: routeData.duration
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
  
  clearRoutes: () => {
    set({ routes: [] });
    toast.info('All routes cleared');
  },
});
