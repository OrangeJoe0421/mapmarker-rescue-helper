
import { toast } from 'sonner';
import { StateCreator } from 'zustand';
import { EmergencyService } from '@/types/mapTypes';
import { supabase } from '@/integrations/supabase/client';

export interface ServicesState {
  emergencyServices: EmergencyService[];
  selectedService: EmergencyService | null;
  
  // Actions
  setEmergencyServices: (services: EmergencyService[]) => void;
  selectService: (service: EmergencyService | null) => void;
  verifyEmergencyRoom: (serviceId: string, hasEmergencyRoom: boolean) => Promise<void>;
}

export const createServicesSlice: StateCreator<
  ServicesState & { mapCenter?: [number, number] }
> = (set) => ({
  emergencyServices: [],
  selectedService: null,

  setEmergencyServices: async (services) => {
    // Fetch the latest verifications for all services
    const { data: verifications } = await supabase
      .from('hospital_verifications')
      .select('*')
      .order('verified_at', { ascending: false });
    
    // Map verifications to services
    const servicesWithVerification = services.map(service => {
      // Find the latest verification for this service
      const verification = verifications?.find(v => v.service_id === service.id);
      
      if (verification) {
        return {
          ...service,
          verification: {
            hasEmergencyRoom: verification.has_emergency_room,
            verifiedAt: verification.verified_at ? new Date(verification.verified_at) : null
          }
        };
      }
      return service;
    });

    set({ emergencyServices: servicesWithVerification });
    toast.success(`Found ${services.length} emergency services`);
  },

  selectService: (service) => {
    set({
      selectedService: service,
      mapCenter: service ? [service.latitude, service.longitude] : undefined,
    });
  },

  verifyEmergencyRoom: async (serviceId, hasEmergencyRoom) => {
    try {
      // Insert the new verification into Supabase
      const { error } = await supabase
        .from('hospital_verifications')
        .insert({
          service_id: serviceId,
          has_emergency_room: hasEmergencyRoom,
          verified_at: new Date().toISOString()
        });

      if (error) throw error;

      // Update the local state
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
    } catch (error) {
      console.error('Error saving verification:', error);
      toast.error('Failed to save verification');
    }
  },
});
