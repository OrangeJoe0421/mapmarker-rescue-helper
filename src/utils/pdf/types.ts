
import { EmergencyService, CustomMarker, Route, UserLocation } from '@/types/mapTypes';

export interface ExportData {
  userLocation: UserLocation | null;
  emergencyServices: EmergencyService[];
  customMarkers: CustomMarker[];
  routes: Route[];
}
