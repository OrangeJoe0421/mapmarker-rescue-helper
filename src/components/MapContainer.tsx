
import React from 'react';
import LeafletMapMarkers from './LeafletMapMarkers';

const MapContainer = () => {
  return (
    <div className="h-[600px] w-full rounded-lg overflow-hidden border shadow-md relative">
      <LeafletMapMarkers />
      
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/80 px-2 py-1 rounded text-xs">
        OpenStreetMap: Click markers to see route options
      </div>
    </div>
  );
};

export default MapContainer;
