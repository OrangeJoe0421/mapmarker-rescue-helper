
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
      
      // Check what map type we're using
      const mapType = mapElement.getAttribute('data-map-type');
      
      // Wait for the map to be fully rendered
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (mapType === 'google') {
        await captureGoogleMap(mapElement);
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
  
  const captureGoogleMap = async (mapElement: HTMLElement) => {
    console.info("Detected Google Map, attempting to capture");
    
    // For Google Maps we can try to use html2canvas directly
    try {
      await fallbackToHtml2Canvas(mapElement);
    } catch (error) {
      console.error("Error capturing Google Map:", error);
      toast.error('Failed to capture map');
      setCapturing(false);
    }
  };
  
  const fallbackToHtml2Canvas = async (mapElement: HTMLElement) => {
    try {
      console.info("Using html2canvas for capture");
      // Use html2canvas with improved settings
      const canvas = await html2canvas(mapElement, {
        useCORS: true,
        allowTaint: true,
        logging: true,
        scale: 2, // Higher scale for better quality
        backgroundColor: '#ffffff',
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
