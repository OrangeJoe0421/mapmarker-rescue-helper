
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';

export interface UserLocation {
  latitude: number;
  longitude: number;
}

export interface Verification {
  hasEmergencyRoom: boolean;
  verifiedAt: Date | null;
}

export interface EmergencyService {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  road_distance?: number;
  verification?: Verification;
}

export interface CustomMarker {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  color?: string;
  createdAt: Date;
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
}

export interface Route {
  id: string;
  points: RoutePoint[];
  fromId: string;
  toId: string | null; // null when destination is user location
  distance: number;
  duration?: number;
}

interface MapState {
  userLocation: UserLocation | null;
  emergencyServices: EmergencyService[];
  customMarkers: CustomMarker[];
  selectedService: EmergencyService | null;
  selectedMarker: CustomMarker | null;
  addingMarker: boolean;
  mapCenter: [number, number];
  mapZoom: number;
  routes: Route[];
  
  // Actions
  setUserLocation: (location: UserLocation) => void;
  setEmergencyServices: (services: EmergencyService[]) => void;
  addCustomMarker: (marker: Omit<CustomMarker, 'id' | 'createdAt'>) => void;
  updateCustomMarker: (id: string, updates: Partial<CustomMarker>) => void;
  deleteCustomMarker: (id: string) => void;
  selectService: (service: EmergencyService | null) => void;
  selectMarker: (marker: CustomMarker | null) => void;
  toggleAddingMarker: () => void;
  setMapCenter: (center: [number, number]) => void;
  setMapZoom: (zoom: number) => void;
  clearAll: () => void;
  calculateRoute: (fromId: string, toUserLocation: boolean) => Promise<void>;
  clearRoutes: () => void;
  verifyEmergencyRoom: (serviceId: string, hasEmergencyRoom: boolean) => void;
}

const DEFAULT_CENTER: [number, number] = [34.0522, -118.2437]; // Los Angeles
const DEFAULT_ZOOM = 12;

export const useMapStore = create<MapState>()(
  persist(
    (set, get) => ({
      userLocation: null,
      emergencyServices: [],
      customMarkers: [],
      selectedService: null,
      selectedMarker: null,
      addingMarker: false,
      mapCenter: DEFAULT_CENTER,
      mapZoom: DEFAULT_ZOOM,
      routes: [],

      setUserLocation: (location) => {
        set({ 
          userLocation: location,
          mapCenter: [location.latitude, location.longitude], 
          mapZoom: 13 
        });
      },

      setEmergencyServices: (services) => {
        set({ emergencyServices: services });
        toast.success(`Found ${services.length} emergency services`);
      },

      addCustomMarker: (marker) => {
        const newMarker = {
          ...marker,
          id: `marker-${Date.now()}`,
          createdAt: new Date(),
        };
        set((state) => ({
          customMarkers: [...state.customMarkers, newMarker],
          addingMarker: false,
        }));
        toast.success(`Added marker: ${marker.name}`);
      },

      updateCustomMarker: (id, updates) => {
        set((state) => ({
          customMarkers: state.customMarkers.map((marker) =>
            marker.id === id ? { ...marker, ...updates } : marker
          ),
        }));
        toast.success('Marker updated');
      },

      deleteCustomMarker: (id) => {
        set((state) => ({
          customMarkers: state.customMarkers.filter((marker) => marker.id !== id),
          selectedMarker: state.selectedMarker?.id === id ? null : state.selectedMarker,
          routes: state.routes.filter(route => route.fromId !== id && route.toId !== id),
        }));
        toast.success('Marker deleted');
      },

      selectService: (service) => {
        set({
          selectedService: service,
          selectedMarker: null,
          mapCenter: service ? [service.latitude, service.longitude] : undefined,
        });
      },

      selectMarker: (marker) => {
        set({
          selectedMarker: marker,
          selectedService: null,
          mapCenter: marker ? [marker.latitude, marker.longitude] : undefined,
        });
      },

      toggleAddingMarker: () => {
        set((state) => {
          const newAddingMarker = !state.addingMarker;
          // Show the appropriate toast message based on the new state
          if (newAddingMarker) {
            toast.info('Click on the map to place a marker');
          } else {
            toast.info('Marker placement mode canceled');
          }
          return { addingMarker: newAddingMarker };
        });
      },

      setMapCenter: (center) => {
        set({ mapCenter: center });
      },

      setMapZoom: (zoom) => {
        set({ mapZoom: zoom });
      },

      verifyEmergencyRoom: (serviceId, hasEmergencyRoom) => {
        set((state) => {
          const updatedServices = state.emergencyServices.map(service => {
            if (service.id === serviceId) {
              return {
                ...service,
                verification: {
                  hasEmergencyRoom,
                  verifiedAt: new Date()
                }
              };
            }
            return service;
          });

          // Also update the selected service if it's the one being verified
          let updatedSelectedService = state.selectedService;
          if (state.selectedService?.id === serviceId) {
            updatedSelectedService = {
              ...state.selectedService,
              verification: {
                hasEmergencyRoom,
                verifiedAt: new Date()
              }
            };
          }

          toast.success(`Verification updated for ${updatedServices.find(s => s.id === serviceId)?.name}`);
          
          return {
            emergencyServices: updatedServices,
            selectedService: updatedSelectedService
          };
        });
      },

      calculateRoute: async (fromId, toUserLocation) => {
        const state = get();
        
        // Validate necessary data
        if (toUserLocation && !state.userLocation) {
          toast.error('Please set a user location first');
          return;
        }
        
        const sourceMarker = state.customMarkers.find(marker => marker.id === fromId);
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

      clearAll: () => {
        set({
          userLocation: null,
          emergencyServices: [],
          customMarkers: [],
          selectedService: null,
          selectedMarker: null,
          routes: [],
          mapCenter: DEFAULT_CENTER,
          mapZoom: DEFAULT_ZOOM,
        });
        toast.info('All data cleared');
      },
    }),
    {
      name: 'emergency-map-storage',
      partialize: (state) => ({
        customMarkers: state.customMarkers,
        userLocation: state.userLocation,
      }),
    }
  )
);

// Helper function for calculating distance
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
