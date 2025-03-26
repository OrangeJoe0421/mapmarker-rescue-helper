
export interface UserLocation {
  latitude: number;
  longitude: number;
  metadata?: MarkerMetadata;
}

export interface Verification {
  hasEmergencyRoom: boolean;
  verifiedAt: Date | null;
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
  road_distance?: number;
  verification?: Verification;
}

export interface MarkerMetadata {
  projectNumber?: string;
  region?: string;
  projectType?: string;
}

export interface CustomMarker {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  color?: string;
  createdAt: Date;
  metadata?: MarkerMetadata;
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
}

export interface RouteDirection {
  text: string;
  distance: number;
  time: number;
}

export interface Route {
  id: string;
  points: RoutePoint[];
  fromId: string;
  toId: string | null; // null when destination is user location
  distance: number;
  duration?: number;
  directions?: RouteDirection[];
}
