
import { Route } from '../types/mapTypes';

/**
 * Service to handle map image capturing and state
 */
export const mapCaptureService = {
  capturedImage: null as string | null,
  capturedAt: null as Date | null,
  routeSnapshot: [] as Route[],
  staleFlag: false,
  
  setCapturedImage(imageData: string | null) {
    this.capturedImage = imageData;
    this.capturedAt = imageData ? new Date() : null;
    this.routeSnapshot = [];
    this.staleFlag = false;
  },
  
  getCapturedImage() {
    return this.capturedImage;
  },
  
  getCaptureTimestamp() {
    return this.capturedAt;
  },
  
  notifyRouteAdded(routes: Route[]) {
    // Store a snapshot of routes when they're added
    this.routeSnapshot = [...routes];
    console.info(`Route snapshot updated with ${routes.length} routes`);
  },
  
  isOutOfSync(currentRoutes: Route[]) {
    // If lengths differ, definitely out of sync
    if (this.routeSnapshot.length !== currentRoutes.length) {
      return true;
    }
    
    // Check if we have a capture and routes
    if (this.capturedImage && currentRoutes.length > 0) {
      // Compare route IDs to see if they've changed
      const snapshotIds = this.routeSnapshot.map(r => r.id).sort().join(',');
      const currentIds = currentRoutes.map(r => r.id).sort().join(',');
      return snapshotIds !== currentIds;
    }
    
    return false;
  },
  
  isCaptureStale() {
    // Return the stale flag value
    return this.staleFlag;
  },
  
  markCaptureStaleDueToRouteChange() {
    // Set the stale flag to true when routes change
    this.staleFlag = true;
    console.info('Map capture marked as stale due to route change');
  },
  
  clearCapture() {
    this.capturedImage = null;
    this.capturedAt = null;
    this.routeSnapshot = [];
    this.staleFlag = false;
  }
};
