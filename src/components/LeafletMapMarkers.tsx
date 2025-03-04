
import React from 'react';
import { Marker, Popup, useMap, Polyline } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Button } from './ui/button';
import { useMapStore } from '../store/useMapStore';
import EmergencyRoomVerification from './EmergencyRoomVerification';

const LeafletMapMarkers = () => {
  const map = useMap();
  const {
    userLocation,
    emergencyServices,
    customMarkers,
    selectService,
    selectMarker,
    addCustomMarker,
    updateCustomMarker,
    calculateRoute,
    routes
  } = useMapStore();

  // Define icons for different marker types
  const userIcon = new Icon({
    iconUrl: '/user-marker.svg',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });

  const hospitalIcon = new Icon({
    iconUrl: '/hospital-marker.svg',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });

  const customIcon = new Icon({
    iconUrl: '/custom-marker.svg',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });

  // Handle map click for adding custom markers
  const handleMapClick = (e: any) => {
    const { addingMarker } = useMapStore.getState();
    if (!addingMarker) return;

    const { lat, lng } = e.latlng;
    addCustomMarker({
      name: 'New Marker',
      latitude: lat,
      longitude: lng,
      color: '#3B82F6',
    });
  };

  // Add map click listener
  React.useEffect(() => {
    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [map]);

  return (
    <>
      {/* User location marker */}
      {userLocation && (
        <Marker
          position={[userLocation.latitude, userLocation.longitude]}
          icon={userIcon}
        >
          <Popup>
            <h3 className="font-bold">Your Location</h3>
          </Popup>
        </Marker>
      )}

      {/* Emergency services markers */}
      {emergencyServices.map((service) => (
        <Marker
          key={service.id}
          position={[service.latitude, service.longitude]}
          icon={hospitalIcon}
          eventHandlers={{
            click: () => selectService(service),
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

      {/* Custom markers */}
      {customMarkers.map((marker) => (
        <Marker
          key={marker.id}
          position={[marker.latitude, marker.longitude]}
          icon={customIcon}
          draggable={true}
          eventHandlers={{
            click: () => selectMarker(marker),
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
                Route to User
              </Button>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Route polylines */}
      {routes.map((route) => (
        <Polyline
          key={route.id}
          positions={route.points.map(point => [point.latitude, point.longitude])}
          color="#3B82F6"
          weight={4}
          opacity={0.7}
        />
      ))}
    </>
  );
};

export default LeafletMapMarkers;
