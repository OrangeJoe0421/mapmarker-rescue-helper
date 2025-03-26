
import React from 'react';
import LeafletMapMarkers from './LeafletMapMarkers';
import { useMapStore } from '../store/useMapStore';
import MapCapture from './MapCapture';
import { mapCaptureService } from './MapCapture';
import { Info } from 'lucide-react';

const MapContainer = () => {
  const { routes } = useMapStore();
  
  // Determine if a map was captured and when
  const capturedImage = mapCaptureService.getCapturedImage();
  const captureTime = mapCaptureService.getCaptureTimestamp();
  const captureStatus = capturedImage 
    ? `Map captured on: ${captureTime?.toLocaleString() || 'unknown time'}` 
    : 'Map not captured yet. Use "Capture Map" before exporting.';
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center text-sm text-gray-500 gap-1">
          <Info className="h-4 w-4" />
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
