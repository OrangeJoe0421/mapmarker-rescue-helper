
import React, { useEffect } from 'react';
import { MapContainer, Marker, Popup, useMap, Polyline, TileLayer } from 'react-leaflet';
import { Icon } from 'leaflet';
import { MapPin, UserCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { useMapStore } from '../store/useMapStore';
import EmergencyRoomVerification from './EmergencyRoomVerification';

// This component needs to be inside the MapContainer to use the map context
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

// Markers component that will be used inside MapContainer
const MapMarkers = () => {
  const {
    userLocation,
    emergencyServices,
    customMarkers,
    selectService,
    selectMarker,
    updateCustomMarker,
    calculateRoute,
    routes
  } = useMapStore();

  // Define icons for different marker types
  const userIcon = new Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="#38a169" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="8" r="5" />
        <path d="M20 21a8 8 0 1 0-16 0" />
      </svg>
    `),
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
    className: 'pulse-animation',
  });

  const hospitalIcon = new Icon({
    iconUrl: '/hospital-marker.svg',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });

  const emsIcon = new Icon({
    iconUrl: '/ems-marker.svg',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });

  const fireIcon = new Icon({
    iconUrl: '/fire-marker.svg',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });

  const lawIcon = new Icon({
    iconUrl: '/law-marker.svg',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });

  const customIcon = new Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="#3B82F6" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    `),
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
  
  // Function to determine icon based on service type
  const getServiceIcon = (service: any) => {
    const type = service.type.toLowerCase();
    if (type.includes('hospital')) return hospitalIcon;
    if (type.includes('ems') || type.includes('ambulance')) return emsIcon;
    if (type.includes('fire')) return fireIcon;
    if (type.includes('law') || type.includes('police')) return lawIcon;
    return hospitalIcon; // Default to hospital icon
  };

  // Function to handle marker click
  const handleMarkerClick = (id: string) => {
    if (userLocation) {
      calculateRoute(id, true);
    }
  };

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
            {userLocation.metadata && (
              <div className="mt-1 text-xs">
                {userLocation.metadata.projectNumber && (
                  <p>Project: {userLocation.metadata.projectNumber}</p>
                )}
                {userLocation.metadata.region && (
                  <p>Region: {userLocation.metadata.region}</p>
                )}
                {userLocation.metadata.projectType && (
                  <p>Type: {userLocation.metadata.projectType}</p>
                )}
              </div>
            )}
          </Popup>
        </Marker>
      )}

      {/* Emergency services markers */}
      {emergencyServices.map((service) => (
        <Marker
          key={service.id}
          position={[service.latitude, service.longitude]}
          icon={getServiceIcon(service)}
          eventHandlers={{
            click: () => {
              selectService(service);
              handleMarkerClick(service.id);
            },
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
            click: () => {
              selectMarker(marker);
              handleMarkerClick(marker.id);
            },
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
