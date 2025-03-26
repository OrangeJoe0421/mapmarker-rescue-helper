
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
      
      // Find the map element
      const mapElement = document.querySelector('[data-map-container="true"]') as HTMLElement;
      
      if (!mapElement) {
        toast.error('Map element not found');
        setCapturing(false);
        return;
      }

      // Ensure the map routes are in a visible state
      // Apply special styling to make routes more visible during capture
      const routeLines = document.querySelectorAll('.leaflet-overlay-pane path');
      routeLines.forEach(line => {
        (line as HTMLElement).style.strokeWidth = '6px';
        (line as HTMLElement).style.stroke = '#FF3B30';
        (line as HTMLElement).style.opacity = '1';
      });

      // Wait a moment for styles to apply
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Use html2canvas for direct screen capture
      const canvas = await html2canvas(mapElement, {
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: null,
        scale: 2, // Higher resolution
      });
      
      // Convert canvas to image data
      const imageData = canvas.toDataURL('image/png');
      
      // Store the captured image
      mapCaptureService.setCapturedImage(imageData);
      
      // Reset route styling
      routeLines.forEach(line => {
        (line as HTMLElement).style.removeProperty('stroke-width');
        (line as HTMLElement).style.removeProperty('stroke');
        (line as HTMLElement).style.removeProperty('opacity');
      });
      
      toast.success('Map captured successfully');
      setNeedsCapture(false);
      setCapturing(false);
      
      if (routes.length === 0) {
        toast.info('No routes found on map. Add routes before exporting for better results.');
      }
      
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
