
import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Camera, RefreshCw } from 'lucide-react';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';
import { useMapStore } from '../store/useMapStore';

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
  
  const captureMap = async () => {
    try {
      setCapturing(true);
      
      // Find the map element - target the whole container to include controls and attribution
      const mapElement = document.querySelector('[data-map-container="true"]') as HTMLElement;
      
      if (!mapElement) {
        toast.error('Map element not found');
        setCapturing(false);
        return;
      }
      
      // First, enhance the visibility of routes for the capture
      const routeElements = document.querySelectorAll('.leaflet-overlay-pane path');
      routeElements.forEach(route => {
        route.classList.add('capture-visible');
        (route as HTMLElement).style.strokeWidth = '6px';
        (route as HTMLElement).style.stroke = '#FF3B30';
        (route as HTMLElement).style.opacity = '1';
      });
      
      // Get the exact dimensions and position of the map on screen
      const rect = mapElement.getBoundingClientRect();
      
      // Wait a moment to ensure all styling is applied
      setTimeout(async () => {
        try {
          // Use html2canvas with direct screen coordinates
          const canvas = await html2canvas(document.body, {
            useCORS: true,
            allowTaint: true,
            backgroundColor: null,
            scale: 2, // Higher resolution
            logging: false,
            x: rect.left, // Capture from the left edge of the map
            y: rect.top, // Capture from the top edge of the map
            width: rect.width, // Only capture the width of the map
            height: rect.height, // Only capture the height of the map
          });
          
          // Remove the temporary styling
          routeElements.forEach(route => {
            route.classList.remove('capture-visible');
          });
          
          // Convert canvas to data URL
          const imageData = canvas.toDataURL('image/png');
          
          // Store the captured image
          mapCaptureService.setCapturedImage(imageData);
          
          toast.success('Map captured successfully');
          setNeedsCapture(false);
          
          if (routes.length === 0) {
            toast.info('No routes found on map. Add routes before exporting for better results.');
          }
        } catch (error) {
          console.error('Error in canvas capture:', error);
          toast.error('Failed to capture map');
        } finally {
          setCapturing(false);
        }
      }, 500); // Delay capture to ensure map rendering is stable
    } catch (error) {
      console.error('Error capturing map:', error);
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
