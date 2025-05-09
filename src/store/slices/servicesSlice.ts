
import { toast } from 'sonner';
import { StateCreator } from 'zustand';
import { EmergencyService } from '@/types/mapTypes';

export interface ServicesState {
  emergencyServices: EmergencyService[];
  selectedService: EmergencyService | null;
  
  // Actions
  setEmergencyServices: (services: EmergencyService[]) => void;
  selectService: (service: EmergencyService | null) => void;
}

export const createServicesSlice: StateCreator<
  ServicesState & { mapCenter?: [number, number] }
> = (set) => ({
  emergencyServices: [],
  selectedService: null,

  setEmergencyServices: (services) => {
    // Sort by distance
    const sortedServices = [...services].sort((a, b) => {
      return (a.road_distance || Infinity) - (b.road_distance || Infinity);
    });

    set({ emergencyServices: sortedServices });
    
    if (services.length > 0) {
      toast.success(`Found ${services.length} emergency services`);
    }
  },

  selectService: (service) => {
    set({
      selectedService: service,
      mapCenter: service ? [service.latitude, service.longitude] : undefined,
    });
  },
});
