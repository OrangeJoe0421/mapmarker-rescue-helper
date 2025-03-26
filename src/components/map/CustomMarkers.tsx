
import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { customIcon } from './MapIcons';
import { Button } from '../ui/button';
import { CustomMarker } from '../../types/mapTypes';

interface CustomMarkersProps {
  markers: CustomMarker[];
  selectMarker: (marker: CustomMarker) => void;
  updateCustomMarker: (id: string, updates: Partial<CustomMarker>) => void;
  calculateRoute: (markerId: string, toUserLocation: boolean) => void;
}

const CustomMarkers: React.FC<CustomMarkersProps> = ({ 
  markers, 
  selectMarker, 
  updateCustomMarker, 
  calculateRoute 
}) => {
  // Make sure markers are interactive
  const handleMarkerClick = (marker: CustomMarker) => {
    selectMarker(marker);
  };

  return (
    <>
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          position={[marker.latitude, marker.longitude]}
          icon={customIcon}
          draggable={true}
          eventHandlers={{
            click: () => handleMarkerClick(marker),
            dragend: (e) => {
              const { lat, lng } = e.target.getLatLng();
              updateCustomMarker(marker.id, {
                ...marker,
                latitude: lat,
                longitude: lng,
              });
            }
          }}
        >
          <Popup>
            <h3 className="font-bold">{marker.name}</h3>
            <p className="text-xs text-gray-500">
              Created: {marker.createdAt.toLocaleString()}
            </p>
            <div className="flex mt-2 gap-2">
              <Button size="sm" onClick={() => calculateRoute(marker.id, true)}>
                Route to Project
              </Button>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
};

export default CustomMarkers;
