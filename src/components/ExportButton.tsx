
import React from 'react';
import { Button } from './ui/button';
import { FileDown } from 'lucide-react';
import { useMapStore } from '../store/useMapStore';
import { exportToPdf } from '../utils/pdfExport';
import { toast } from 'sonner';

const ExportButton = () => {
  const { userLocation, emergencyServices, customMarkers, routes } = useMapStore();
  
  const handleExport = () => {
    try {
      exportToPdf({
        userLocation,
        emergencyServices,
        customMarkers,
        routes
      });
      toast.success('Report exported successfully!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export report. Please try again.');
    }
  };
  
  return (
    <Button 
      onClick={handleExport}
      className="bg-blue-600 hover:bg-blue-700"
      disabled={!userLocation && customMarkers.length === 0}
    >
      <FileDown className="mr-2 h-4 w-4" />
      Export Report
    </Button>
  );
};

export default ExportButton;
