
import React, { useEffect } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { useMapStore } from '../store/useMapStore';
import MapEvents from './map/MapEvents';
import MapMarkers from './map/MapMarkers';

// Main component that renders the map container and all markers
const LeafletMapMarkers = () => {
  const { mapCenter, mapZoom, routes } = useMapStore();
  
  // Force a redraw of the map when routes change
  useEffect(() => {
    if (routes.length > 0) {
      // Short timeout to ensure route lines are drawn
      setTimeout(() => {
        const routeLines = document.querySelectorAll('.leaflet-overlay-pane path');
        routeLines.forEach(line => {
          // Apply styling directly for better visibility
          line.setAttribute('stroke', '#FF3B30');
          line.setAttribute('stroke-width', '8');
          line.setAttribute('stroke-opacity', '1');
          line.setAttribute('stroke-linecap', 'round');
          line.setAttribute('stroke-linejoin', 'round');
          (line as HTMLElement).style.visibility = 'visible';
          (line as HTMLElement).style.display = 'block';
        });
      }, 500);
    }
  }, [routes]);
  
  return (
    <div 
      className="h-full w-full rounded-lg overflow-hidden"
      data-map-container="true"
      data-map-type="leaflet"
      data-has-routes={routes.length > 0 ? "true" : "false"}
      data-routes-count={routes.length.toString()}
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
