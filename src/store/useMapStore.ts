
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
  
  // Ensure we expose the setState method
  setState: (state: Partial<MapState>) => void;
}

export const useMapStore = create<MapState>()(
  persist(
    (...args) => {
      // Extract the set function from args for clarity
      const set = args[0];
      // Get the slices with their state and actions
      const locationSlice = createLocationSlice(...args);
      const servicesSlice = createServicesSlice(...args);
      const markersSlice = createMarkersSlice(...args);
      const routesSlice = createRoutesSlice(...args);
      
      return {
        ...locationSlice,
        ...servicesSlice,
        ...markersSlice,
        ...routesSlice,
        
        // Add the setState method for direct state updates
        setState: (state) => set(state),

        clearAll: () => {
          // Reset all state values
          set({
            userLocation: null,
            emergencyServices: [],
            customMarkers: [],
            selectedService: null,
            selectedMarker: null,
            routes: [], // Explicitly ensure routes are empty
            mapCenter: DEFAULT_CENTER,
            mapZoom: DEFAULT_ZOOM,
          });
          toast.info('All data cleared');
        },
      };
    },
    {
      name: 'emergency-map-storage',
      partialize: (state) => ({
        customMarkers: state.customMarkers,
        userLocation: state.userLocation,
      }),
    }
  )
);
