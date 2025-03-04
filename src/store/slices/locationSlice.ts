
import { toast } from 'sonner';
import { StateCreator } from 'zustand';
import { UserLocation } from '@/types/mapTypes';

export interface LocationState {
  userLocation: UserLocation | null;
  mapCenter: [number, number];
  mapZoom: number;
  
  // Actions
  setUserLocation: (location: UserLocation) => void;
  setMapCenter: (center: [number, number]) => void;
  setMapZoom: (zoom: number) => void;
}

export const DEFAULT_CENTER: [number, number] = [34.0522, -118.2437]; // Los Angeles
export const DEFAULT_ZOOM = 12;

export const createLocationSlice: StateCreator<LocationState> = (set) => ({
  userLocation: null,
  mapCenter: DEFAULT_CENTER,
  mapZoom: DEFAULT_ZOOM,

  setUserLocation: (location) => {
    set({ 
      userLocation: location,
      mapCenter: [location.latitude, location.longitude], 
      mapZoom: 13 
    });
  },

  setMapCenter: (center) => {
    set({ mapCenter: center });
  },

  setMapZoom: (zoom) => {
    set({ mapZoom: zoom });
  },
});
