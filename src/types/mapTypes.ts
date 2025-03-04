
export interface UserLocation {
  latitude: number;
  longitude: number;
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
  road_distance?: number;
  verification?: Verification;
}

export interface CustomMarker {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  color?: string;
  createdAt: Date;
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
}

export interface Route {
  id: string;
  points: RoutePoint[];
  fromId: string;
  toId: string | null; // null when destination is user location
  distance: number;
  duration?: number;
}
