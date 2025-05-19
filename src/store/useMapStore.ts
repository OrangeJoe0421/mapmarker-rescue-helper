
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';

// Import all the slices
import { LocationState, createLocationSlice, DEFAULT_CENTER, DEFAULT_ZOOM } from './slices/locationSlice';
import { ServicesState, createServicesSlice } from './slices/servicesSlice';
import { MarkersState, createMarkersSlice } from './slices/markersSlice';
import { RoutesState, createRoutesSlice } from './slices/routesSlice';
import { mapCaptureService } from '@/services/mapCaptureService';

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
        // First clear routes specifically to trigger all necessary side effects
        const currentState = args[0].getState();
        if (currentState.clearRoutes) {
          currentState.clearRoutes();
        }
        
        // Then reset everything else
        args[0]({
          userLocation: null,
          emergencyServices: [],
          customMarkers: [],
          selectedService: null,
          selectedMarker: null,
          routes: [], // Explicitly set routes to empty array again
          mapCenter: DEFAULT_CENTER,
          mapZoom: DEFAULT_ZOOM,
        });
        
        // Ensure map capture is cleared
        mapCaptureService.clearCapture();
        
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
