
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

const MapCapture = () => {
  const [capturing, setCapturing] = useState(false);
  const { routes } = useMapStore();
  
  // Check if recapture is needed
  const needsCapture = routes.length > 0 && 
    (!mapCaptureService.getCapturedImage() || mapCaptureService.isOutOfSync(routes));

  const captureMap = async () => {
    try {
      setCapturing(true);
      console.info("Starting map capture process");
      
      // Clear any previous capture
      mapCaptureService.clearCapture();
      
      // Find the map container - target the actual map element
      const mapElement = document.querySelector('[data-map-container="true"]') as HTMLElement;
      
      if (!mapElement) {
        console.error("Map element not found");
        toast.error('Map element not found');
        setCapturing(false);
        return;
      }

      console.info("Map element found, preparing for capture");
      
      // Wait longer for routes to fully render
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Force redraw of route lines
      const routeElements = document.querySelectorAll('.leaflet-overlay-pane path');
      routeElements.forEach(el => {
        (el as HTMLElement).style.strokeWidth = '8px';
        (el as HTMLElement).style.stroke = '#FF3B30';
        (el as HTMLElement).style.opacity = '1';
        (el as HTMLElement).style.visibility = 'visible';
      });
      
      // Wait for styling to take effect
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        // Use html2canvas with improved settings
        console.info("Starting html2canvas capture with enhanced route visibility");
        const canvas = await html2canvas(mapElement, {
          useCORS: true,
          allowTaint: true,
          logging: true,
          scale: 2, // Higher scale for better quality
          backgroundColor: '#ffffff',
          ignoreElements: (element) => {
            // Don't ignore any elements that might contain routes
            return false;
          },
          onclone: (documentClone, element) => {
            // Find the cloned map element in the cloned document
            const clonedMapElement = documentClone.querySelector('[data-map-container="true"]') as HTMLElement;
            
            if (clonedMapElement) {
              console.info("Enhancing map clone for capture");
              
              // Make sure the map is visible in the clone
              clonedMapElement.style.overflow = 'visible';
              
              // Make sure all map elements are visible
              const allElements = clonedMapElement.querySelectorAll('*');
              allElements.forEach(el => {
                (el as HTMLElement).style.visibility = 'visible';
                (el as HTMLElement).style.opacity = '1';
              });
              
              // Specifically target route lines in SVG
              const routeLines = clonedMapElement.querySelectorAll('.leaflet-overlay-pane path');
              console.info(`Found ${routeLines.length} route lines in the clone`);
              
              routeLines.forEach(line => {
                line.setAttribute('stroke', '#FF3B30');
                line.setAttribute('stroke-width', '8');
                line.setAttribute('stroke-opacity', '1');
                line.setAttribute('stroke-linecap', 'round');
                line.setAttribute('stroke-linejoin', 'round');
                (line as HTMLElement).style.display = 'block';
                (line as HTMLElement).style.visibility = 'visible';
              });
              
              // Target the overall overlay pane
              const overlayPane = clonedMapElement.querySelector('.leaflet-overlay-pane');
              if (overlayPane) {
                (overlayPane as HTMLElement).style.visibility = 'visible';
                (overlayPane as HTMLElement).style.display = 'block';
                (overlayPane as HTMLElement).style.opacity = '1';
                (overlayPane as HTMLElement).style.zIndex = '1000';
              }
            }
          }
        });
        
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
        setCapturing(false);
      }
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
