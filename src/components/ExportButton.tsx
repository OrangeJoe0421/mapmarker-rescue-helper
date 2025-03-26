
import React, { useState } from 'react';
import { Button } from './ui/button';
import { FileDown, AlertTriangle } from 'lucide-react';
import { useMapStore } from '../store/useMapStore';
import { exportToPdf } from '../utils/pdf';
import { toast } from 'sonner';
import { mapCaptureService } from './MapCapture';

const ExportButton = () => {
  const [exporting, setExporting] = useState(false);
  const { userLocation, emergencyServices, customMarkers, routes } = useMapStore();
  
  const handleExport = async () => {
    try {
      setExporting(true);
      
      // Check if a map was captured
      const capturedImage = mapCaptureService.getCapturedImage();
      const routesExist = routes.length > 0;
      
      if (routesExist && !capturedImage) {
        // No capture but routes exist - warn user
        toast.warning(
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>No map capture found. The PDF will not include a map view. Use the "Capture Map" button first.</span>
          </div>, 
          { duration: 5000 }
        );
      } else if (routesExist && capturedImage) {
        // Routes exist and there is a capture - check if capture is older than routes
        const captureTime = mapCaptureService.getCaptureTimestamp() || new Date(0);
        
        // Check if routes were likely added after the capture
        // This is a heuristic since we don't store route creation time
        if (routes.some(route => !route.id.includes(captureTime.getTime().toString()))) {
          toast.info(
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>You may want to re-capture the map to ensure all routes are included in the PDF.</span>
            </div>, 
            { duration: 5000 }
          );
        }
      }
      
      // Ensure map is fully rendered with routes before exporting
      setTimeout(async () => {
        try {
          await exportToPdf({
            userLocation,
            emergencyServices,
            customMarkers,
            routes
          });
          toast.success('Report exported successfully!');
        } catch (error) {
          console.error('Error exporting PDF:', error);
          toast.error('Failed to export report. Please try again.');
        } finally {
          setExporting(false);
        }
      }, 500); // Add a delay to ensure routes are rendered
    } catch (error) {
      console.error('Error during export preparation:', error);
      toast.error('Failed to prepare report. Please try again.');
      setExporting(false);
    }
  };
  
  return (
    <Button 
      onClick={handleExport}
      className="bg-blue-600 hover:bg-blue-700"
      disabled={((!userLocation && customMarkers.length === 0) || exporting)}
    >
      <FileDown className={`mr-2 h-4 w-4 ${exporting ? 'animate-bounce' : ''}`} />
      {exporting ? 'Exporting...' : 'Export Report'}
    </Button>
  );
};

export default ExportButton;
