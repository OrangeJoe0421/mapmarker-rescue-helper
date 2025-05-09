
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface EmergencyService {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  address?: string;
  phone?: string;
  hours?: string;
  distance?: number; // Added distance field to the type
}

export interface CustomMarker {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  description?: string;
  color?: string;
  icon?: string;
}

export interface RouteInfo {
  distance: number;
  duration: number;
  serviceId?: string;
}

export interface MapState {
  userLocation: Coordinates | null;
  emergencyServices: EmergencyService[];
  customMarkers: CustomMarker[];
  routes: Record<string, RouteInfo>;
  selectedService: EmergencyService | null;
}
