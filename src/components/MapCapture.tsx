
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Camera } from 'lucide-react';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

// Create a service to store the captured image
export const mapCaptureService = {
  capturedImage: null as string | null,
  
  setCapturedImage(imageData: string | null) {
    this.capturedImage = imageData;
  },
  
  getCapturedImage() {
    return this.capturedImage;
  }
};

const MapCapture = () => {
  const [capturing, setCapturing] = useState(false);
  
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
      
      // Use html2canvas to capture the map
      const canvas = await html2canvas(mapElement, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        scale: 2, // Higher resolution
        logging: false
      });
      
      // Convert canvas to data URL
      const imageData = canvas.toDataURL('image/png');
      
      // Store the captured image
      mapCaptureService.setCapturedImage(imageData);
      
      toast.success('Map captured successfully');
    } catch (error) {
      console.error('Error capturing map:', error);
      toast.error('Failed to capture map');
    } finally {
      setCapturing(false);
    }
  };
  
  return (
    <Button 
      variant="outline" 
      onClick={captureMap} 
      disabled={capturing}
      className="flex items-center gap-2"
    >
      <Camera className={`h-4 w-4 ${capturing ? 'animate-pulse' : ''}`} />
      {capturing ? 'Capturing...' : 'Capture Map'}
    </Button>
  );
};

export default MapCapture;
