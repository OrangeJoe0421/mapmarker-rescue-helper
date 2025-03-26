
import React, { useEffect, useState } from 'react';
import { useMapStore } from '../store/useMapStore';
import MapCapture from './MapCapture';
import { mapCaptureService } from './MapCapture';
import ArcGISMap from './map/ArcGISMap';
import { Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from './ui/dialog';
import { Button } from './ui/button';

const MapContainer = () => {
  const { routes } = useMapStore();
  const [captureStatus, setCaptureStatus] = useState({
    text: 'Map not captured yet. Use "Capture Map" before exporting.',
    icon: <Info className="h-4 w-4" />,
    class: "text-gray-500"
  });
  const [showPreview, setShowPreview] = useState(false);
  
  // Update capture status whenever relevant state changes
  useEffect(() => {
    const capturedImage = mapCaptureService.getCapturedImage();
    const captureTime = mapCaptureService.getCaptureTimestamp();
    const isStale = mapCaptureService.isCaptureStale();
    
    if (capturedImage) {
      if (isStale) {
        setCaptureStatus({
          text: `Map view has changed since last capture (${captureTime?.toLocaleString() || 'unknown time'}). Please recapture.`,
          icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
          class: "text-amber-500"
        });
      } else {
        setCaptureStatus({
          text: `Map captured on: ${captureTime?.toLocaleString() || 'unknown time'}`,
          icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
          class: "text-green-500"
        });
      }
    } else if (routes.length > 0) {
      setCaptureStatus({
        text: 'Map not captured yet. Use "Capture Map" before exporting.',
        icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
        class: "text-amber-500"
      });
    } else {
      setCaptureStatus({
        text: 'No routes to capture. Add routes first.',
        icon: <Info className="h-4 w-4" />,
        class: "text-gray-500"
      });
    }
  }, [routes, mapCaptureService.getCapturedImage(), mapCaptureService.isCaptureStale()]);

  // Handler to open preview if we have a captured image
  const handlePreviewClick = () => {
    const image = mapCaptureService.getCapturedImage();
    if (image) {
      setShowPreview(true);
    }
  };
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div 
          className={`flex items-center text-sm ${captureStatus.class} gap-1 cursor-pointer`}
          onClick={handlePreviewClick}
        >
          {captureStatus.icon}
          <span>{captureStatus.text}</span>
          {mapCaptureService.getCapturedImage() && (
            <Button variant="ghost" size="sm" className="ml-1 h-6 px-2">
              View Capture
            </Button>
          )}
        </div>
        <MapCapture />
      </div>
      
      <div 
        className="h-[600px] w-full rounded-lg overflow-hidden border shadow-md relative"
        data-map-container="true"
        data-map-type="arcgis"
        data-has-routes={routes.length > 0 ? "true" : "false"}
        data-routes-count={routes.length.toString()}
      >
        <ArcGISMap />
        
        <div className="absolute bottom-3 left-3 z-[1000] bg-white/80 px-2 py-1 rounded text-xs">
          ArcGIS: Click markers to see route options
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Map Capture Preview</DialogTitle>
          </DialogHeader>
          <div className="mt-4 border rounded-md overflow-hidden">
            {mapCaptureService.getCapturedImage() ? (
              <img 
                src={mapCaptureService.getCapturedImage()!} 
                alt="Captured Map" 
                className="w-full"
              />
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                No capture available
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MapContainer;
