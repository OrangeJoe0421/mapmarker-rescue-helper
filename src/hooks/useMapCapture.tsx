
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useMapStore } from '../store/useMapStore';
import html2canvas from 'html2canvas';
import { mapCaptureService } from '../services/mapCaptureService';

export function useMapCapture() {
  const [capturing, setCapturing] = useState(false);
  const { routes } = useMapStore();
  
  // Monitor store changes to clear capture data when app is reset
  useEffect(() => {
    const unsubscribe = useMapStore.subscribe((state, prevState) => {
      // Check if the app has been reset (all data cleared)
      if (
        prevState.emergencyServices.length > 0 && 
        state.emergencyServices.length === 0 &&
        prevState.customMarkers.length > 0 &&
        state.customMarkers.length === 0 &&
        prevState.userLocation && 
        !state.userLocation
      ) {
        mapCaptureService.clearCapture();
      }
    });
    
    // Clean up subscription on component unmount
    return () => unsubscribe();
  }, []);
  
  // Check if recapture is needed
  const needsCapture = routes.length > 0 && 
    (!mapCaptureService.getCapturedImage() || mapCaptureService.isOutOfSync(routes));

  const captureMap = async () => {
    try {
      setCapturing(true);
      console.info("Starting map capture process");
      
      // Clear any previous capture
      mapCaptureService.clearCapture();
      
      // Find the map container
      const mapElement = document.querySelector('[data-map-container="true"]') as HTMLElement;
      
      if (!mapElement) {
        console.error("Map element not found");
        toast.error('Map element not found');
        setCapturing(false);
        return;
      }

      console.info("Map element found, preparing for capture");
      
      // Check if we're using ArcGIS
      const mapType = mapElement.getAttribute('data-map-type');
      
      // Wait for the map to be fully rendered
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (mapType === 'arcgis') {
        await captureArcGISMap(mapElement);
      } else {
        // For other map types, use html2canvas
        await fallbackToHtml2Canvas(mapElement);
      }
    } catch (error) {
      console.error('Error in capture process:', error);
      toast.error('Failed to capture map');
      setCapturing(false);
    }
  };
  
  const captureArcGISMap = async (mapElement: HTMLElement) => {
    console.info("Detected ArcGIS map, using specialized capture method");
    // For ArcGIS maps, we need to use the view's takeScreenshot method
    // Look for the ArcGIS view instance
    // It's stored in the window.__arcgisView property by our ArcGISMap component
    const arcgisView = (window as any).__arcgisView;
    
    if (arcgisView && arcgisView.takeScreenshot) {
      try {
        console.info("Taking ArcGIS screenshot");
        const screenshot = await arcgisView.takeScreenshot({
          width: mapElement.clientWidth * 2,  // Higher resolution
          height: mapElement.clientHeight * 2,
          format: "png"
        });
        
        // The screenshot is returned as a data URL
        const imageData = screenshot.dataUrl;
        
        // Store the captured image and route snapshot
        mapCaptureService.setCapturedImage(imageData);
        mapCaptureService.notifyRouteAdded(routes);
        console.info("ArcGIS capture saved to service");
        
        toast.success('Map captured successfully');
        setCapturing(false);
      } catch (arcgisError) {
        console.error("Error taking ArcGIS screenshot:", arcgisError);
        // Fallback to html2canvas if ArcGIS screenshot fails
        await fallbackToHtml2Canvas(mapElement);
      }
    } else {
      console.warn("ArcGIS view not found or doesn't support screenshots, falling back to html2canvas");
      // Fallback to html2canvas
      await fallbackToHtml2Canvas(mapElement);
    }
  };
  
  const fallbackToHtml2Canvas = async (mapElement: HTMLElement) => {
    try {
      console.info("Using html2canvas as fallback");
      // Use html2canvas with improved settings
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
              if (el instanceof HTMLElement) {
                el.style.visibility = 'visible';
                el.style.opacity = '1';
              }
            });
            
            // Specifically target route lines in SVG
            const routeLines = clonedMapElement.querySelectorAll('.esri-layer-graphics path');
            console.info(`Found ${routeLines.length} route lines in the clone`);
            
            routeLines.forEach(line => {
              line.setAttribute('stroke', '#FF3B30');
              line.setAttribute('stroke-width', '8');
              line.setAttribute('stroke-opacity', '1');
              line.setAttribute('stroke-linecap', 'round');
              line.setAttribute('stroke-linejoin', 'round');
              if (line instanceof HTMLElement) {
                line.style.display = 'block';
                line.style.visibility = 'visible';
              }
            });
            
            // Target the overall graphics layer
            const overlayPane = clonedMapElement.querySelector('.esri-layer-graphics');
            if (overlayPane && overlayPane instanceof HTMLElement) {
              overlayPane.style.visibility = 'visible';
              overlayPane.style.display = 'block';
              overlayPane.style.opacity = '1';
              overlayPane.style.zIndex = '1000';
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
      console.error('Error during html2canvas capture:', error);
      toast.error('Failed to capture map');
    } finally {
      setCapturing(false);  // Ensure we reset capturing state even on errors
    }
  };

  return {
    capturing,
    needsCapture,
    captureMap
  };
}
