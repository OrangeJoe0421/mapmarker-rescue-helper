
import { toast } from 'sonner';
import { StateCreator } from 'zustand';
import { EmergencyService } from '@/types/mapTypes';

export interface ServicesState {
  emergencyServices: EmergencyService[];
  selectedService: EmergencyService | null;
  
  // Actions
  setEmergencyServices: (services: EmergencyService[]) => void;
  selectService: (service: EmergencyService | null) => void;
  updateService: (updatedService: EmergencyService) => void;
}

export const createServicesSlice: StateCreator<
  ServicesState & { mapCenter?: [number, number] }
> = (set) => ({
  emergencyServices: [],
  selectedService: null,

  setEmergencyServices: (services) => {
    if (!services || services.length === 0) {
      console.log("No services provided, clearing the list");
      set({ emergencyServices: [], selectedService: null });
      return;
    }
    
    // Sort by distance
    const sortedServices = [...services].sort((a, b) => {
      return (a.road_distance || Infinity) - (b.road_distance || Infinity);
    });

    console.log(`Setting ${sortedServices.length} emergency services`);
    
    // Reset the state with the new services
    set({ 
      emergencyServices: sortedServices,
      // Clear selected service to avoid showing stale data
      selectedService: null
    });
    
    if (services.length > 0) {
      // Count service types found to display in the toast
      const types = new Set(services.map(s => s.type));
      const typesMessage = Array.from(types).join(", ");
      console.log(`Setting services: ${services.length} services of types: ${typesMessage}`);
      console.log("Search results:", services);
      
      toast.success(`Found ${services.length} emergency services (${typesMessage})`);
    }
  },

  selectService: (service) => {
    set({
      selectedService: service,
      mapCenter: service ? [service.latitude, service.longitude] : undefined,
    });
  },
  
  // Add new function to update a single service
  updateService: (updatedService) => {
    set(state => ({
      emergencyServices: state.emergencyServices.map(service => 
        service.id === updatedService.id ? updatedService : service
      ),
      // If this was the selected service, update it there too
      selectedService: state.selectedService?.id === updatedService.id ? 
        updatedService : state.selectedService
    }));
    console.log(`Service updated: ${updatedService.name}`);
  }
});
