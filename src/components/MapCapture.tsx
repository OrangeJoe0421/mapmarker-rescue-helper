
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
  
  const captureMap = async () => {
    try {
      setCapturing(true);
      console.info("Starting map capture process...");
      logCaptureState();
      
      // Clear any previous capture first
      mapCaptureService.clearCapture();
      
      // Find the map element - targeting the actual Leaflet container
      const mapElement = document.querySelector('.leaflet-container') as HTMLElement;
      
      if (!mapElement) {
        console.error("Map element not found", document.querySelectorAll('[data-map-container]'));
        toast.error('Map element not found');
        setCapturing(false);
        return;
      }

      console.info("Map element found:", mapElement);

      // Ensure the map routes are in a visible state
      const routeLines = document.querySelectorAll('.leaflet-overlay-pane path');
      console.info(`Found ${routeLines.length} route lines`);
      
      routeLines.forEach((line, index) => {
        console.info(`Enhancing route line ${index}`);
        (line as HTMLElement).style.strokeWidth = '8px';
        (line as HTMLElement).style.stroke = '#FF3B30';
        (line as HTMLElement).style.opacity = '1';
      });

      // Wait a moment for styles to apply
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Use html2canvas for direct screen capture with improved settings
      console.info("Starting html2canvas capture");
      const canvas = await html2canvas(mapElement, {
        useCORS: true,
        allowTaint: true,
        logging: true, // Enable logging for debugging
        backgroundColor: null,
        scale: 2, // Higher resolution
        ignoreElements: (element) => {
          // Don't ignore any elements related to the map
          return false;
        },
        onclone: (documentClone, element) => {
          // This gets triggered before the capture, allowing us to modify the cloned DOM
          console.info("Preparing cloned document for capture");
          const routeLinesInClone = documentClone.querySelectorAll('.leaflet-overlay-pane path');
          routeLinesInClone.forEach((line) => {
            (line as HTMLElement).style.strokeWidth = '8px';
            (line as HTMLElement).style.stroke = '#FF3B30';
            (line as HTMLElement).style.opacity = '1';
          });
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
