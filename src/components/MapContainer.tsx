
import React from 'react';
import LeafletMapMarkers from './LeafletMapMarkers';
import { useMapStore } from '../store/useMapStore';
import MapCapture from './MapCapture';

const MapContainer = () => {
  const { routes } = useMapStore();
  
  return (
    <div className="space-y-2">
      <div className="flex justify-end">
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
