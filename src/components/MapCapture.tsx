
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
    
    // Create a new stylesheet with more aggressive SVG styling
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
      
      /* Target SVG paths inside the overlay pane specifically */
      .leaflet-overlay-pane path {
        stroke: #FF3B30 !important;
        stroke-width: 8px !important;
        stroke-opacity: 1 !important;
        stroke-linecap: round !important;
        stroke-linejoin: round !important;
        vector-effect: non-scaling-stroke !important;
      }
    `;
    document.head.appendChild(styleSheet);
    return styleSheet;
  };
  
  // Apply transform "jolts" to force repainting of SVG elements
  const forceMapRepaint = () => {
    // Find all svg paths in the overlay pane
    const svgPaths = document.querySelectorAll('.leaflet-overlay-pane path');
    console.info(`Found ${svgPaths.length} SVG paths to force-repaint`);
    
    // Apply a temporary style to force a repaint
    svgPaths.forEach((path, index) => {
      const svgElement = path as SVGElement;
      // Save original values
      const originalStroke = svgElement.getAttribute('stroke');
      const originalWidth = svgElement.getAttribute('stroke-width');
      
      // Apply new values to force a repaint
      svgElement.setAttribute('stroke', '#FF3B30');
      svgElement.setAttribute('stroke-width', '8');
      svgElement.setAttribute('stroke-opacity', '1');
      svgElement.setAttribute('stroke-linecap', 'round');
      svgElement.setAttribute('stroke-linejoin', 'round');
      
      console.info(`Enhanced SVG path ${index} for capture`);
    });
  };
  
  const captureMap = async () => {
    try {
      setCapturing(true);
      console.info("Starting map capture process with completely new approach...");
      
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

      // Add stylesheet for capture - this applies more aggressive styling
      const captureStyles = createCaptureStylesheet();
      
      // Force repaints of all SVG paths
      forceMapRepaint();
      
      // Apply CSS transformation to reset the map view containers
      // This can help "shake" the map into rendering properly
      const mapPane = mapElement.querySelector('.leaflet-map-pane') as HTMLElement;
      if (mapPane) {
        // Save original transform
        const originalTransform = mapPane.style.transform;
        
        // Apply small shifts to force browser to recalculate positions
        mapPane.style.transform = 'translate3d(0.1px, 0.1px, 0px)';
        
        setTimeout(() => {
          mapPane.style.transform = 'translate3d(0px, 0px, 0px)';
          
          setTimeout(() => {
            // Restore original transform
            mapPane.style.transform = originalTransform;
          }, 10);
        }, 10);
      }
      
      // Wait for the map to stabilize and all styles to apply
      // Using a longer delay based on previous attempts
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.info("Starting html2canvas capture with enhanced settings");
      const canvas = await html2canvas(mapElement, {
        useCORS: true,
        allowTaint: true,
        logging: true,
        backgroundColor: null,
        scale: 2, // Higher scale for better quality
        onclone: (documentClone, element) => {
          console.info("Preparing cloned document for capture");
          
          // Find all SVG paths in the clone and enhance them
          const routeLines = documentClone.querySelectorAll('.leaflet-overlay-pane path');
          console.info(`Found ${routeLines.length} route lines in clone to enhance`);
          
          routeLines.forEach((line, index) => {
            const svgElement = line as SVGElement;
            svgElement.setAttribute('stroke', '#FF3B30');
            svgElement.setAttribute('stroke-width', '8');
            svgElement.setAttribute('stroke-opacity', '1');
            svgElement.setAttribute('stroke-linecap', 'round');
            svgElement.setAttribute('stroke-linejoin', 'round');
            svgElement.setAttribute('vector-effect', 'non-scaling-stroke');
            svgElement.classList.add('capture-route-line');
            console.info(`Deeply enhanced route line ${index} in clone`);
          });
          
          // Apply new styles to the clone document's head
          const cloneHead = documentClone.head;
          const cloneStyle = documentClone.createElement('style');
          cloneStyle.innerHTML = captureStyles.innerHTML;
          cloneHead.appendChild(cloneStyle);
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
