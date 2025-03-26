
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Camera, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useMapStore } from '../store/useMapStore';
import html2canvas from 'html2canvas';
import { Route } from '../types/mapTypes';

// Create a service to store the captured image
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
  
  // Add the missing isCaptureStale method
  isCaptureStale() {
    // Return the stale flag value
    return this.staleFlag;
  },
  
  // Add the missing markCaptureStaleDueToRouteChange method
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

const MapCapture = () => {
  const [capturing, setCapturing] = useState(false);
  const { routes } = useMapStore();
  
  // Check if recapture is needed
  const needsCapture = routes.length > 0 && 
    (!mapCaptureService.getCapturedImage() || mapCaptureService.isOutOfSync(routes));

  const captureMap = async () => {
    try {
      setCapturing(true);
      console.info("Starting map capture process with a new approach");
      
      // Clear any previous capture
      mapCaptureService.clearCapture();
      
      // Find the map container
      const mapElement = document.querySelector('.leaflet-container') as HTMLElement;
      
      if (!mapElement) {
        console.error("Map element not found");
        toast.error('Map element not found');
        setCapturing(false);
        return;
      }

      console.info("Map element found, preparing for capture");

      // Create a temporary style element for capture
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        .leaflet-control-container { display: none !important; }
        .leaflet-overlay-pane path.capture-route-line {
          stroke: #FF3B30 !important;
          stroke-width: 8px !important;
          stroke-opacity: 1 !important;
          stroke-linecap: round !important;
          stroke-linejoin: round !important;
          animation: none !important;
          transition: none !important;
        }
      `;
      document.head.appendChild(styleElement);
      
      // Force the browser to recalculate layout
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(async () => {
          // Wait for any animations to finish
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          try {
            // Create a clone of the map element before capturing
            // This gives us a fresh copy without any lingering issues
            const mapClone = mapElement.cloneNode(true) as HTMLElement;
            const originalDisplay = mapElement.style.display;
            
            // Hide the original map
            mapElement.style.display = 'none';
            
            // Style the clone for capture
            mapClone.style.position = 'absolute';
            mapClone.style.top = '0';
            mapClone.style.left = '0';
            mapClone.style.zIndex = '-1000';
            mapClone.style.width = mapElement.offsetWidth + 'px';
            mapClone.style.height = mapElement.offsetHeight + 'px';
            mapClone.style.overflow = 'hidden';
            
            // Apply additional route highlighting to the clone
            const routeElements = mapClone.querySelectorAll('.leaflet-overlay-pane path');
            routeElements.forEach(path => {
              const svgPath = path as SVGElement;
              svgPath.setAttribute('stroke', '#FF3B30');
              svgPath.setAttribute('stroke-width', '8');
              svgPath.setAttribute('stroke-linecap', 'round');
              svgPath.setAttribute('stroke-linejoin', 'round');
              svgPath.setAttribute('stroke-opacity', '1');
              svgPath.classList.add('capture-ready');
            });
            
            // Add the clone to the document
            document.body.appendChild(mapClone);
            
            // Wait for the clone to be fully rendered
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Capture the cloned map
            console.info("Starting html2canvas capture of cloned map");
            const canvas = await html2canvas(mapClone, {
              useCORS: true,
              allowTaint: true,
              backgroundColor: null,
              scale: 2, // Higher scale for better quality
              logging: true,
              ignoreElements: (element) => {
                // Ignore UI controls
                return element.classList.contains('leaflet-control-container');
              }
            });
            
            // Clean up - remove the clone and restore the original
            document.body.removeChild(mapClone);
            mapElement.style.display = originalDisplay;
            
            // Convert canvas to image data
            const imageData = canvas.toDataURL('image/png');
            console.info("Canvas generated, image size:", imageData.length);
            
            // Verify the image data is valid (not empty or just a header)
            if (imageData.length < 1000) {
              console.error("Generated image is too small, likely empty");
              toast.error('Failed to capture map - empty image');
              setCapturing(false);
              return;
            }
            
            // Store the captured image and route snapshot
            mapCaptureService.setCapturedImage(imageData);
            mapCaptureService.notifyRouteAdded(routes);
            console.info("Capture saved to service");
            
            toast.success('Map captured successfully');
          } catch (error) {
            console.error('Error during capture process:', error);
            toast.error('Failed to capture map');
          } finally {
            // Clean up the temporary style
            styleElement.remove();
            setCapturing(false);
          }
        });
      });
    } catch (error) {
      console.error('Error in capture process:', error);
      toast.error('Failed to capture map');
      setCapturing(false);
    }
  };
  
  return (
    <Button 
      variant={needsCapture ? "destructive" : "outline"}
      onClick={captureMap} 
      disabled={capturing}
      className="flex items-center gap-2"
    >
      {needsCapture ? (
        <RefreshCw className={`h-4 w-4 ${capturing ? 'animate-pulse' : 'animate-spin'}`} />
      ) : (
        <Camera className={`h-4 w-4 ${capturing ? 'animate-pulse' : ''}`} />
      )}
      {capturing ? 'Capturing...' : needsCapture ? 'Recapture Map' : 'Capture Map'}
    </Button>
  );
};

export default MapCapture;
