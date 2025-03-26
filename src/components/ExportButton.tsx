
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
      const isStale = mapCaptureService.isCaptureStale();
      
      if (routesExist && !capturedImage) {
        // No capture but routes exist - warn user with more prominent message
        toast.warning(
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <span>No map capture found. The PDF will not include a map view. Use the "Capture Map" button first.</span>
          </div>, 
          { duration: 5000 }
        );
      } else if (routesExist && capturedImage && isStale) {
        // Routes exist and capture is stale
        toast.warning(
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <span>Your map view has changed since the last capture. Please recapture the map before exporting.</span>
          </div>, 
          { duration: 5000 }
        );
      }
      
      // Check for hospital routes
      const hasHospitalRoutes = routes.some(route => {
        const service = emergencyServices.find(s => s.id === route.fromId);
        return service && 
               typeof service.type === 'string' && 
               (service.type.toLowerCase().includes('hospital') || 
                service.type.toLowerCase().includes('medical center'));
      });
      
      if (routesExist && !hasHospitalRoutes) {
        toast.info('Note: Detailed driving instructions are only shown for hospital routes in the PDF');
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
      className="bg-primary hover:bg-primary/90 text-primary-foreground"
      disabled={((!userLocation && customMarkers.length === 0) || exporting)}
    >
      <FileDown className={`mr-2 h-4 w-4 ${exporting ? 'animate-bounce' : ''}`} />
      {exporting ? 'Exporting...' : 'Export Report'}
    </Button>
  );
};

export default ExportButton;
