
import { toast } from 'sonner';
import { StateCreator } from 'zustand';
import { UserLocation, MarkerMetadata } from '@/types/mapTypes';

export interface LocationState {
  userLocation: UserLocation | null;
  mapCenter: [number, number];
  mapZoom: number;
  
  // Actions
  setUserLocation: (location: UserLocation) => void;
  updateUserLocationMetadata: (metadata: MarkerMetadata) => void;
  setMapCenter: (center: [number, number]) => void;
  setMapZoom: (zoom: number) => void;
}

export const DEFAULT_CENTER: [number, number] = [34.0522, -118.2437]; // Los Angeles
export const DEFAULT_ZOOM = 12;

export const createLocationSlice: StateCreator<
  LocationState & { 
    routes?: any[]; 
    clearRoutes?: () => void;
  }
> = (set, get) => ({
  userLocation: null,
  mapCenter: DEFAULT_CENTER,
  mapZoom: DEFAULT_ZOOM,

  setUserLocation: (location) => {
    // Check for valid location data before setting
    if (typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
      console.error('Invalid location data:', location);
      toast.error('Invalid location data provided');
      return;
    }

    console.info('Setting user location:', location);
    
    // Create a valid UserLocation object
    const userLocation: UserLocation = {
      latitude: location.latitude,
      longitude: location.longitude,
      metadata: location.metadata
    };
    
    // Clear old routes when setting a new location
    const clearRoutes = get().clearRoutes;
    if (clearRoutes) {
      clearRoutes();
    }
    
    set({ 
      userLocation,
      mapCenter: [location.latitude, location.longitude], 
      mapZoom: 13 
    });
    
    toast.success('Location set successfully');
  },

  updateUserLocationMetadata: (metadata) => {
    const { userLocation } = get();
    if (!userLocation) {
      toast.error('No location selected');
      return;
    }

    // Filter out empty metadata fields
    const filteredMetadata: MarkerMetadata = {};
    
    if (metadata.projectNumber?.trim()) {
      filteredMetadata.projectNumber = metadata.projectNumber.trim();
    }
    
    if (metadata.region?.trim()) {
      filteredMetadata.region = metadata.region.trim();
    }
    
    if (metadata.projectType?.trim()) {
      filteredMetadata.projectType = metadata.projectType.trim();
    }

    set({
      userLocation: {
        ...userLocation,
        metadata: Object.keys(filteredMetadata).length > 0 ? filteredMetadata : undefined
      }
    });

    toast.success('Location metadata updated');
  },

  setMapCenter: (center) => {
    set({ mapCenter: center });
  },

  setMapZoom: (zoom) => {
    set({ mapZoom: zoom });
  },
});
