
import { toast } from 'sonner';
import { StateCreator } from 'zustand';
import { Route, RoutePoint } from '@/types/mapTypes';
import { calculateHaversineDistance } from '@/utils/mapUtils';

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
    
    const sourceMarker = state.customMarkers?.find(marker => marker.id === fromId);
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
      // In a real app, here we would make an API call to a routing service
      // For now, we'll simulate a route with a straight line
      const routeId = `route-${Date.now()}`;
      
      // Create simulated route points (just a direct line for demo)
      const startPoint: RoutePoint = {
        latitude: sourceMarker.latitude,
        longitude: sourceMarker.longitude
      };
      
      const endPoint: RoutePoint = toUserLocation 
        ? { latitude: state.userLocation!.latitude, longitude: state.userLocation!.longitude }
        : { latitude: 0, longitude: 0 }; // Will be replaced with actual destination
      
      // Create a simple route with just start and end points
      // In a real app, this would be replaced with actual waypoints from routing API
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
      
      const newRoute: Route = {
        id: routeId,
        points: routePoints,
        fromId: sourceMarker.id,
        toId: toUserLocation ? null : "destination-id", // In our demo, always null for user location
        distance: distance,
        duration: distance / 50 * 60 // Rough estimate: 50 km/h average speed
      };
      
      // Add the route to state
      set((state) => ({
        routes: [...state.routes, newRoute]
      }));
      
      toast.success(`Route calculated: ${distance.toFixed(2)} km`);
    } catch (error) {
      console.error("Error calculating route:", error);
      toast.error("Failed to calculate route");
    }
  },
  
  clearRoutes: () => {
    set({ routes: [] });
    toast.info('All routes cleared');
  },
});
