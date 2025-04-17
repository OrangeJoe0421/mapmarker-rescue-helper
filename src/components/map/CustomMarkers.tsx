
import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { customIcon } from './MapIcons';
import { Button } from '../ui/button';
import { CustomMarker } from '../../types/mapTypes';
import { GripVertical } from 'lucide-react';
import { useMapStore } from '@/store/useMapStore';

interface CustomMarkersProps {
  markers: CustomMarker[];
  selectMarker: (marker: CustomMarker) => void;
  updateCustomMarker: (id: string, updates: Partial<CustomMarker>) => void;
}

const CustomMarkers: React.FC<CustomMarkersProps> = ({ 
  markers, 
  selectMarker, 
  updateCustomMarker
}) => {
  const { emergencyServices, calculateRoute } = useMapStore();
  
  // Get only hospital services for the dropdown
  const hospitals = emergencyServices.filter(service => 
    service.type.toLowerCase().includes('hospital')
  );

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
            
            <div className="flex flex-col gap-2 mt-3">
              <Button 
                size="sm" 
                onClick={() => calculateRoute(marker.id, true)}
                className="w-full"
              >
                Route to Project Location
              </Button>
              
              {hospitals.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium">Route to nearest hospitals:</p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {hospitals.slice(0, 3).map(hospital => (
                      <Button
                        key={hospital.id}
                        size="sm"
                        variant="outline"
                        className="w-full text-xs h-7"
                        onClick={() => calculateRoute(marker.id, false, hospital.id)}
                      >
                        {hospital.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
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
