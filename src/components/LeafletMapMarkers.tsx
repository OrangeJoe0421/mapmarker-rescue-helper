
import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { useMapStore } from '../store/useMapStore';
import MapEvents from './map/MapEvents';
import MapMarkers from './map/MapMarkers';

// Main component that renders the map container and all markers
const LeafletMapMarkers = () => {
  const { mapCenter, mapZoom, routes } = useMapStore();
  
  return (
    <div 
      className="h-full w-full rounded-lg overflow-hidden"
      data-map-container="true"
      data-map-type="leaflet"
      data-has-routes={routes.length > 0 ? "true" : "false"}
    >
      <MapContainer 
        center={mapCenter} 
        zoom={mapZoom} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        className="z-10"
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
