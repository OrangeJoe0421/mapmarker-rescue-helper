
import React from 'react';
import LeafletMapMarkers from './LeafletMapMarkers';
import { useMapStore } from '../store/useMapStore';
import MapCapture from './MapCapture';
import { mapCaptureService } from './MapCapture';
import { Info, AlertTriangle } from 'lucide-react';

const MapContainer = () => {
  const { routes } = useMapStore();
  
  // Determine if a map was captured and when
  const capturedImage = mapCaptureService.getCapturedImage();
  const captureTime = mapCaptureService.getCaptureTimestamp();
  const isStale = mapCaptureService.isCaptureStale();
  
  // Determine capture status message and styling
  let captureStatus = 'Map not captured yet. Use "Capture Map" before exporting.';
  let statusIcon = <Info className="h-4 w-4" />;
  let statusClass = "text-gray-500";
  
  if (capturedImage) {
    if (isStale) {
      captureStatus = `Map view has changed since last capture (${captureTime?.toLocaleString() || 'unknown time'}). Please recapture.`;
      statusIcon = <AlertTriangle className="h-4 w-4 text-amber-500" />;
      statusClass = "text-amber-500";
    } else {
      captureStatus = `Map captured on: ${captureTime?.toLocaleString() || 'unknown time'}`;
      statusClass = "text-green-500";
    }
  } else if (routes.length > 0) {
    statusIcon = <AlertTriangle className="h-4 w-4 text-amber-500" />;
    statusClass = "text-amber-500";
  }
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className={`flex items-center text-sm ${statusClass} gap-1`}>
          {statusIcon}
          <span>{captureStatus}</span>
        </div>
        <MapCapture />
      </div>
      
      <div 
        className="h-[600px] w-full rounded-lg overflow-hidden border shadow-md relative"
        data-map-container="true"
        data-map-type="leaflet"
        data-has-routes={routes.length > 0 ? "true" : "false"}
      >
        <LeafletMapMarkers />
        
        <div className="absolute bottom-3 left-3 z-[1000] bg-white/80 px-2 py-1 rounded text-xs">
          OpenStreetMap: Click markers to see route options
        </div>
      </div>
    </div>
  );
};

export default MapContainer;
