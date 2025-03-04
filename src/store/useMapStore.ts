
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';

// Import all the slices
import { LocationState, createLocationSlice, DEFAULT_CENTER, DEFAULT_ZOOM } from './slices/locationSlice';
import { ServicesState, createServicesSlice } from './slices/servicesSlice';
import { MarkersState, createMarkersSlice } from './slices/markersSlice';
import { RoutesState, createRoutesSlice } from './slices/routesSlice';

// Re-export types from the types file
export * from '@/types/mapTypes';

// Combine all the state interfaces
interface MapState extends 
  LocationState,
  ServicesState,
  MarkersState,
  RoutesState {
  // Global actions
  clearAll: () => void;
}

export const useMapStore = create<MapState>()(
  persist(
    (...args) => ({
      ...createLocationSlice(...args),
      ...createServicesSlice(...args),
      ...createMarkersSlice(...args),
      ...createRoutesSlice(...args),

      clearAll: () => {
        args[0]({
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
