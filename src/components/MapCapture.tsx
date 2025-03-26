import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Camera, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useMapStore } from '../store/useMapStore';
import html2canvas from 'html2canvas';

// Create a service to store the captured image
export const mapCaptureService = {
  capturedImage: null as string | null,
  capturedAt: null as Date | null,
  isStale: false,
  
  setCapturedImage(imageData: string | null) {
    this.capturedImage = imageData;
    this.capturedAt = imageData ? new Date() : null;
    this.isStale = false;
  },
  
  getCapturedImage() {
    return this.capturedImage;
  },
  
  getCaptureTimestamp() {
    return this.capturedAt;
  },
  
  markCaptureStaleDueToRouteChange() {
    if (this.capturedImage) {
      this.isStale = true;
    }
  },
  
  isCaptureStale() {
    return this.isStale;
  },
  
  clearCapture() {
    this.capturedImage = null;
    this.capturedAt = null;
    this.isStale = false;
  }
};

const MapCapture = () => {
  const [capturing, setCapturing] = useState(false);
  const { routes } = useMapStore();
  const [needsCapture, setNeedsCapture] = useState(false);
  
  // Check if we need to show "needs capture" indication
  useEffect(() => {
    if (routes.length > 0 && 
        (!mapCaptureService.getCapturedImage() || mapCaptureService.isCaptureStale())) {
      setNeedsCapture(true);
    } else {
      setNeedsCapture(false);
    }
  }, [routes, mapCaptureService.isCaptureStale()]);

  // Debug function to check capture state
  const logCaptureState = () => {
    console.info("Capture state:", {
      hasImage: !!mapCaptureService.getCapturedImage(),
      captureTimestamp: mapCaptureService.getCaptureTimestamp(),
      isStale: mapCaptureService.isCaptureStale(),
      needsCapture,
      routesCount: routes.length
    });
  };

  // Create a stylesheet for route capture styling
  const createCaptureStylesheet = () => {
    // Remove any existing capture stylesheet
    const existingSheet = document.getElementById('capture-styles');
    if (existingSheet) {
      existingSheet.remove();
    }
    
    // Create a new stylesheet
    const styleSheet = document.createElement('style');
    styleSheet.id = 'capture-styles';
    styleSheet.innerHTML = `
      .capture-route-line {
        stroke: #FF3B30 !important;
        stroke-width: 8px !important;
        stroke-opacity: 1 !important;
        stroke-linecap: round !important;
        stroke-linejoin: round !important;
        vector-effect: non-scaling-stroke !important;
        stroke-dasharray: none !important;
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(styleSheet);
    return styleSheet;
  };
  
  const captureMap = async () => {
    try {
      setCapturing(true);
      console.info("Starting map capture process with new approach...");
      
      // Clear any previous capture first
      mapCaptureService.clearCapture();
      
      // Find the map element - targeting the actual Leaflet container
      const mapElement = document.querySelector('.leaflet-container') as HTMLElement;
      
      if (!mapElement) {
        console.error("Map element not found");
        toast.error('Map element not found');
        setCapturing(false);
        return;
      }

      console.info("Map element found, preparing for capture");

      // Add stylesheet for capture
      const captureStyles = createCaptureStylesheet();
      
      // Force a complete map re-render before capture
      const map = mapElement.querySelector('.leaflet-map-pane') as HTMLElement;
      if (map) {
        // Save original transform
        const originalTransform = map.style.transform;
        
        // Apply a slight nudge to force redraw
        map.style.transform = 'translate3d(0px, 0px, 0px)';
        
        // Restore original transform
        setTimeout(() => {
          map.style.transform = originalTransform;
        }, 10);
      }
      
      // Wait longer for the map to stabilize and styles to apply
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.info("Starting html2canvas capture");
      const canvas = await html2canvas(mapElement, {
        useCORS: true,
        allowTaint: true,
        logging: true,
        backgroundColor: null,
        scale: 2,
        ignoreElements: (element) => {
          return false; // Don't ignore any elements
        },
        onclone: (documentClone, element) => {
          console.info("Preparing cloned document for capture");
          
          // Add our capture styles to the cloned document
          const cloneHead = documentClone.head;
          const cloneStyle = documentClone.createElement('style');
          cloneStyle.innerHTML = captureStyles.innerHTML;
          cloneHead.appendChild(cloneStyle);
          
          // Find all route lines in the clone and mark them
          const routeLines = documentClone.querySelectorAll('.leaflet-overlay-pane path');
          console.info(`Found ${routeLines.length} route lines in clone`);
          
          routeLines.forEach((line, index) => {
            const svgElement = line as SVGElement;
            svgElement.classList.add('capture-route-line');
            console.info(`Enhanced route line ${index} in clone`);
          });
        }
      });
      
      // Convert canvas to image data
      const imageData = canvas.toDataURL('image/png');
      console.info("Canvas generated, image size:", imageData.length);
      
      // Remove the temporary stylesheet
      captureStyles.remove();
      
      // Verify the image data is valid (not empty or just a header)
      if (imageData.length < 1000) {
        console.error("Generated image is too small, likely empty");
        toast.error('Failed to capture map - empty image');
        setCapturing(false);
        return;
      }
      
      // Store the captured image
      mapCaptureService.setCapturedImage(imageData);
      console.info("Capture saved to service");
      
      toast.success('Map captured successfully');
      setNeedsCapture(false);
      
      // Log the state after capture
      logCaptureState();
    } catch (error) {
      console.error('Error capturing map:', error);
      toast.error('Failed to capture map');
    } finally {
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
