
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';

export interface UserLocation {
  latitude: number;
  longitude: number;
}

export interface EmergencyService {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  road_distance?: number;
}

export interface CustomMarker {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  color?: string;
  createdAt: Date;
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

      clearAll: () => {
        set({
          userLocation: null,
          emergencyServices: [],
          customMarkers: [],
          selectedService: null,
          selectedMarker: null,
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
