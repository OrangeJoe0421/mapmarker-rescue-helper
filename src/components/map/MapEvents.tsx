
import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { useMapStore } from '../../store/useMapStore';

const MapEvents = () => {
  const map = useMap();
  const { addingMarker, addCustomMarker } = useMapStore();
  
  useEffect(() => {
    if (!addingMarker) return;
    
    const handleMapClick = (e: any) => {
      const { lat, lng } = e.latlng;
      if (!addingMarker) return;
      
      addCustomMarker({
        name: 'New Marker',
        latitude: lat,
        longitude: lng,
        color: '#3B82F6',
      });
    };
    
    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [map, addingMarker, addCustomMarker]);
  
  return null;
};

export default MapEvents;
