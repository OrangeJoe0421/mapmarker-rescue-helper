
import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { customIcon } from './MapIcons';
import { Button } from '../ui/button';
import { CustomMarker } from '../../types/mapTypes';
import { GripVertical } from 'lucide-react';

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
  // Make marker clicks interactive
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
          eventHandlers={{
            click: () => handleMarkerClick(marker),
          }}
        >
          <Popup>
            <h3 className="font-bold text-lg">{marker.name}</h3>
            
            {marker.metadata && (
              <div className="text-xs mt-1">
                {marker.metadata.projectNumber && (
                  <p>Project: {marker.metadata.projectNumber}</p>
                )}
                {marker.metadata.region && (
                  <p>Region: {marker.metadata.region}</p>
                )}
                {marker.metadata.projectType && (
                  <p>Type: {marker.metadata.projectType}</p>
                )}
              </div>
            )}
            
            <div className="flex mt-3 gap-2">
              <Button size="sm" onClick={() => calculateRoute(marker.id, true)}>
                Route to Project
              </Button>
            </div>
            
            <div className="mt-2 bg-muted/30 p-1 rounded flex items-center text-xs text-muted-foreground">
              <GripVertical className="h-3 w-3 mr-1" />
              <span>Drag marker to reposition</span>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
};

export default CustomMarkers;
