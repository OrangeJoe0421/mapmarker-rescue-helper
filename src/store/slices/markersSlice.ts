
import { toast } from 'sonner';
import { StateCreator } from 'zustand';
import { CustomMarker } from '@/types/mapTypes';

export interface MarkersState {
  customMarkers: CustomMarker[];
  selectedMarker: CustomMarker | null;
  addingMarker: boolean;
  draggingMarker: string | null;
  
  // Actions
  addCustomMarker: (marker: Omit<CustomMarker, 'id' | 'createdAt'>) => void;
  updateCustomMarker: (id: string, updates: Partial<CustomMarker>) => void;
  deleteCustomMarker: (id: string) => void;
  selectMarker: (marker: CustomMarker | null) => void;
  toggleAddingMarker: () => void;
  setDraggingMarker: (id: string | null) => void;
  updateMarkerPosition: (id: string, latitude: number, longitude: number) => void;
}

export const createMarkersSlice: StateCreator<
  MarkersState & { mapCenter?: [number, number]; routes?: any[] }
> = (set) => ({
  customMarkers: [],
  selectedMarker: null,
  addingMarker: false,
  draggingMarker: null,

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
      routes: state.routes?.filter(route => route.fromId !== id && route.toId !== id),
    }));
    toast.success('Marker deleted');
  },

  selectMarker: (marker) => {
    set({
      selectedMarker: marker,
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
  
  // New actions for drag-and-drop functionality
  setDraggingMarker: (id) => {
    set({ draggingMarker: id });
  },
  
  updateMarkerPosition: (id, latitude, longitude) => {
    set((state) => ({
      customMarkers: state.customMarkers.map((marker) =>
        marker.id === id ? { ...marker, latitude, longitude } : marker
      ),
      draggingMarker: null,
    }));
    // Don't show a toast to avoid spamming when dragging
  },
});
