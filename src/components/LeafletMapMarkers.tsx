
import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { useMapStore } from '../store/useMapStore';
import MapEvents from './map/MapEvents';
import MapMarkers from './map/MapMarkers';

// Main component that renders the map container and all markers
const LeafletMapMarkers = () => {
  const { mapCenter, mapZoom } = useMapStore();
  
  return (
    <div className="h-[600px] w-full rounded-lg overflow-hidden border shadow-md">
      <MapContainer 
        center={mapCenter} 
        zoom={mapZoom} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEvents />
        <MapMarkers />
      </MapContainer>
    </div>
  );
};

export default LeafletMapMarkers;
