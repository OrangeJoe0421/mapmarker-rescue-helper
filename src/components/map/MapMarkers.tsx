
import React from 'react';
import { useMapStore } from '../../store/useMapStore';

// Since we're not using Leaflet anymore, this component isn't needed
// We're just providing a placeholder that doesn't render anything
// The actual markers are now handled directly in the ArcGISMap component
const MapMarkers = () => {
  console.log('MapMarkers component is no longer used with ArcGIS');
  return null;
};

export default MapMarkers;
