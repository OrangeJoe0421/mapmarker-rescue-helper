
import { toast } from 'sonner';
import { StateCreator } from 'zustand';
import { EmergencyService } from '@/types/mapTypes';

export interface ServicesState {
  emergencyServices: EmergencyService[];
  selectedService: EmergencyService | null;
  
  // Actions
  setEmergencyServices: (services: EmergencyService[]) => void;
  selectService: (service: EmergencyService | null) => void;
  findNearestHospital: () => EmergencyService | null;
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
    set({
      selectedService: service,
      mapCenter: service ? [service.latitude, service.longitude] : undefined,
    });
  },
  
  findNearestHospital: () => {
    const { emergencyServices } = get();
    
    if (!emergencyServices || emergencyServices.length === 0) {
      return null;
    }
    
    // Filter to only include hospitals
    const hospitals = emergencyServices.filter(service => 
      service.type.toLowerCase().includes('hospital')
    );
    
    if (hospitals.length === 0) {
      return null;
    }
    
    // Sort by road_distance if available, otherwise by direct distance
    const sortedHospitals = [...hospitals].sort((a, b) => {
      if (a.road_distance !== undefined && b.road_distance !== undefined) {
        return a.road_distance - b.road_distance;
      }
      return (a.distance || Infinity) - (b.distance || Infinity);
    });
    
    return sortedHospitals[0];
  }
});
