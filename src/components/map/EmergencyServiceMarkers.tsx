
import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { getServiceIcon } from './MapIcons';
import { Button } from '../ui/button';
import EmergencyRoomVerification from '../EmergencyRoomVerification';
import { EmergencyService } from '../../types/mapTypes';

interface EmergencyServiceMarkersProps {
  services: EmergencyService[];
  selectService: (service: EmergencyService) => void;
  calculateRoute: (serviceId: string, toUserLocation: boolean) => void;
}

const EmergencyServiceMarkers: React.FC<EmergencyServiceMarkersProps> = ({ 
  services, 
  selectService, 
  calculateRoute 
}) => {
  // Function to handle marker click - no longer calculates route automatically
  const handleMarkerClick = (service: EmergencyService) => {
    selectService(service);
  };

  return (
    <>
      {services.map((service) => (
        <Marker
          key={service.id}
          position={[service.latitude, service.longitude]}
          icon={getServiceIcon(service)}
          eventHandlers={{
            click: () => handleMarkerClick(service),
          }}
        >
          <Popup>
            <h3 className="font-bold text-lg">{service.name}</h3>
            <p className="text-sm">{service.type}</p>
            {service.road_distance && (
              <p className="text-xs mt-1">{service.road_distance.toFixed(2)} km away</p>
            )}
            
            {/* Add the verification component */}
            <EmergencyRoomVerification service={service} />
            
            <div className="flex mt-3 gap-2">
              <Button size="sm" onClick={() => calculateRoute(service.id, true)}>
                Route to User
              </Button>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
};

export default EmergencyServiceMarkers;
