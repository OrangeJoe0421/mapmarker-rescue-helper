
import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Camera, RefreshCw } from 'lucide-react';
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
      
      // Find the map element
      const mapElement = document.querySelector('.leaflet-container') as HTMLElement;
      
      if (!mapElement) {
        toast.error('Map element not found');
        setCapturing(false);
        return;
      }

      // Find the container for all layers (base tile layer + overlays)
      const mapPanes = mapElement.querySelector('.leaflet-map-pane') as HTMLElement;
      if (!mapPanes) {
        toast.error('Map panes not found');
        setCapturing(false);
        return;
      }
      
      // Apply special styling to make routes more visible during capture
      const routeLines = document.querySelectorAll('.leaflet-overlay-pane path');
      routeLines.forEach(line => {
        (line as HTMLElement).style.strokeWidth = '6px';
        (line as HTMLElement).style.stroke = '#FF3B30';
        (line as HTMLElement).style.opacity = '1';
      });
      
      // Get the dimensions of the map
      const rect = mapElement.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      
      // Create an SVG representation of the map
      const svgNS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(svgNS, "svg");
      svg.setAttribute("width", String(width));
      svg.setAttribute("height", String(height));
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      
      // Clone the tile images and convert to embedded images in the SVG
      const tileImages = mapElement.querySelectorAll('.leaflet-tile-container img');
      
      const promises = Array.from(tileImages).map(img => {
        return new Promise<void>((resolve) => {
          try {
            const imgEl = img as HTMLImageElement;
            const imgRect = imgEl.getBoundingClientRect();
            const relativeX = imgRect.left - rect.left;
            const relativeY = imgRect.top - rect.top;
            
            // Create an image element in the SVG
            const svgImage = document.createElementNS(svgNS, "image");
            svgImage.setAttribute("x", String(relativeX));
            svgImage.setAttribute("y", String(relativeY));
            svgImage.setAttribute("width", String(imgRect.width));
            svgImage.setAttribute("height", String(imgRect.height));
            svgImage.setAttribute("href", imgEl.src);
            svg.appendChild(svgImage);
            resolve();
          } catch (err) {
            console.error("Error processing tile:", err);
            resolve();
          }
        });
      });
      
      // Wait for all images to be processed
      await Promise.all(promises);
      
      // Clone route lines
      const routePaths = mapElement.querySelectorAll('.leaflet-overlay-pane path');
      routePaths.forEach(path => {
        const pathEl = path as SVGPathElement;
        const clone = pathEl.cloneNode(true) as SVGPathElement;
        // Make sure route is clearly visible in the capture
        clone.setAttribute('stroke', '#FF3B30');
        clone.setAttribute('stroke-width', '6');
        clone.setAttribute('opacity', '1');
        svg.appendChild(clone);
      });
      
      // Add markers
      const markers = mapElement.querySelectorAll('.leaflet-marker-pane .leaflet-marker-icon');
      markers.forEach(marker => {
        const markerEl = marker as HTMLImageElement;
        const markerRect = markerEl.getBoundingClientRect();
        const relativeX = markerRect.left - rect.left;
        const relativeY = markerRect.top - rect.top;
        
        // Create an image element in the SVG for the marker
        const svgImage = document.createElementNS(svgNS, "image");
        svgImage.setAttribute("x", String(relativeX));
        svgImage.setAttribute("y", String(relativeY));
        svgImage.setAttribute("width", String(markerRect.width));
        svgImage.setAttribute("height", String(markerRect.height));
        svgImage.setAttribute("href", markerEl.src);
        svg.appendChild(svgImage);
      });
      
      // Convert SVG to a data URL
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml" });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      // Create a canvas to render the SVG
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        toast.error('Failed to create canvas context');
        setCapturing(false);
        URL.revokeObjectURL(svgUrl);
        return;
      }
      
      // Create an image from the SVG and draw it on the canvas
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(svgUrl);
        
        // Convert canvas to a data URL
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
      };
      
      img.onerror = (err) => {
        console.error('Error loading SVG image:', err);
        toast.error('Failed to capture map');
        URL.revokeObjectURL(svgUrl);
        setCapturing(false);
      };
      
      img.src = svgUrl;
      
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
