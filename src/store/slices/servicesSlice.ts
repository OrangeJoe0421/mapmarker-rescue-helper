
import { toast } from 'sonner';
import { StateCreator } from 'zustand';
import { EmergencyService } from '@/types/mapTypes';

export interface ServicesState {
  emergencyServices: EmergencyService[];
  selectedService: EmergencyService | null;
  
  // Actions
  setEmergencyServices: (services: EmergencyService[]) => void;
  selectService: (service: EmergencyService | null) => void;
  verifyEmergencyRoom: (serviceId: string, hasEmergencyRoom: boolean) => void;
}

export const createServicesSlice: StateCreator<
  ServicesState & { mapCenter?: [number, number] }
> = (set) => ({
  emergencyServices: [],
  selectedService: null,

  setEmergencyServices: (services) => {
    set({ emergencyServices: services });
    toast.success(`Found ${services.length} emergency services`);
  },

  selectService: (service) => {
    set({
      selectedService: service,
      mapCenter: service ? [service.latitude, service.longitude] : undefined,
    });
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
});
