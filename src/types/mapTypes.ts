
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

export interface UserLocation {
  latitude: number;
  longitude: number;
  metadata?: MarkerMetadata;
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
  state?: string;
  distance?: number;  // As the crow flies distance from project
  road_distance?: number;  // Road network distance from project
  verification?: {
    hasEmergencyRoom?: boolean;
    verifiedAt?: Date;
    comments?: string;
  };
}

export interface CustomMarker {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  description?: string;
  color?: string;
  icon?: string;
  metadata?: MarkerMetadata;
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
}

export interface RouteStep {
  instructions: string;
  distance: number;
  duration: number;
  startLocation: {
    lat: number;
    lng: number;
  };
  endLocation: {
    lat: number;
    lng: number;
  };
  maneuver?: string;
}

export interface Route {
  id: string;
  points: RoutePoint[];
  fromId: string;
  toId: string | null;
  distance: number;
  duration?: number;
  steps?: RouteStep[];
}

export interface RouteInfo {
  distance: number;
  duration: number;
  serviceId?: string;
}

export interface MapState {
  userLocation: UserLocation | null;
  emergencyServices: EmergencyService[];
  customMarkers: CustomMarker[];
  routes: Record<string, RouteInfo>;
  selectedService: EmergencyService | null;
}

// GeoJSON interfaces
export interface GeoJSONPoint {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

export interface GeoJSONFeature {
  type: "Feature";
  id: number | string;
  geometry: GeoJSONPoint;
  properties: {
    [key: string]: any;
    NAME?: string;
    ADDRESS?: string;
    CITY?: string;
    STATE?: string;
    ZIPCODE?: string;
    PHONE?: string;
    HOURS?: string;
  };
}

export interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  crs?: {
    type: string;
    properties: {
      name: string;
    };
  };
  features: GeoJSONFeature[];
}
