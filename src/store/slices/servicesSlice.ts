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
  
  // New function to add a hospital while replacing any existing hospitals
  addHospitalReplacingOthers: (hospital: EmergencyService) => void;
}

export const createServicesSlice: StateCreator<
  ServicesState & { mapCenter?: [number, number] }
> = (set, get) => ({
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
    // Make sure the service is in the emergencyServices array first
    if (service) {
      const state = get();
      const existingServices = state.emergencyServices;
      const serviceIndex = existingServices.findIndex(s => s.id === service.id);
      
      // If the service isn't in our list yet, add it
      if (serviceIndex === -1) {
        set(state => ({
          emergencyServices: [...state.emergencyServices, service],
          selectedService: service,
          mapCenter: [service.latitude, service.longitude],
        }));
        return;
      }
    }
    
    // Normal selection
    set({
      selectedService: service,
      mapCenter: service ? [service.latitude, service.longitude] : undefined,
    });
  },
  
  // Enhanced function to update a single service
  updateService: (updatedService) => {
    set(state => {
      const currentServices = state.emergencyServices;
      const serviceIndex = currentServices.findIndex(service => service.id === updatedService.id);
      
      let newServices;
      if (serviceIndex === -1) {
        // Service not found in the list, add it
        newServices = [...currentServices, updatedService];
        console.log(`Service added to list: ${updatedService.name}`);
      } else {
        // Update existing service
        newServices = currentServices.map(service => 
          service.id === updatedService.id ? updatedService : service
        );
        console.log(`Service updated: ${updatedService.name}`);
      }
      
      return {
        emergencyServices: newServices,
        // If this was the selected service, update it there too
        selectedService: state.selectedService?.id === updatedService.id ? 
          updatedService : state.selectedService
      };
    });
  },
  
  // New function to add a hospital while replacing any existing hospitals
  addHospitalReplacingOthers: (hospital) => {
    set(state => {
      // Filter out any existing hospitals (keep non-hospital services)
      const nonHospitalServices = state.emergencyServices.filter(
        service => !service.type.toLowerCase().includes('hospital')
      );
      
      // Add the new hospital to the filtered services
      const newServices = [...nonHospitalServices, hospital];
      console.log(`Added hospital ${hospital.name}, replacing any existing hospitals`);
      
      return {
        emergencyServices: newServices,
        selectedService: hospital,
        mapCenter: [hospital.latitude, hospital.longitude],
      };
    });
    
    toast.success(`Set ${hospital.name} as the only hospital in results`);
  }
});
