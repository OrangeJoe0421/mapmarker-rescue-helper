
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Verification {
  hasEmergencyRoom: boolean;
  verifiedAt: Date | null;
}

export interface MarkerMetadata {
  projectNumber?: string;
  region?: string;
  projectType?: string;
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
  distance?: number;
  road_distance?: number; // Added road_distance field to the type
  verification?: Verification; // Added verification field to the type
}

export interface CustomMarker {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  description?: string;
  color?: string;
  icon?: string;
  metadata?: MarkerMetadata; // Added metadata field to the type
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
}

export interface Route {
  id: string;
  points: RoutePoint[];
  distance: number;
  duration: number;
  fromId: string;
  toId: string;
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
