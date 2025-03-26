
import React, { useState } from 'react';
import { Button } from './ui/button';
import { FileDown } from 'lucide-react';
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
      if (routes.length > 0 && !mapCaptureService.getCapturedImage()) {
        toast.warning('No map capture found. The PDF will not include a map view. Use the "Capture Map" button first.', {
          duration: 5000
        });
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
