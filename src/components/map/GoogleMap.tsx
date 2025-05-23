
import React, { useCallback, useEffect, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Polyline } from '@react-google-maps/api';
import { useMapStore } from '../../store/useMapStore';
import { Route, EmergencyService } from '@/types/mapTypes';

// Google Maps API key
const GOOGLE_MAPS_API_KEY = "AIzaSyBYXWPdOpB690ph_f9T2ubD9m4fgEqFUl4";

// Define libraries as a constant with proper typing to prevent reloads
// Use the specific type that @react-google-maps/api expects
const GOOGLE_MAPS_LIBRARIES: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ['places', 'geometry'];

const containerStyle = {
  width: '100%',
  height: '100%'
};

// Map styling to match dark theme and hide default places
const mapOptions = {
  styles: [
    {
      "elementType": "geometry",
      "stylers": [{ "color": "#242f3e" }]
    },
    {
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#746855" }]
    },
    {
      "elementType": "labels.text.stroke",
      "stylers": [{ "color": "#242f3e" }]
    },
    {
      "featureType": "poi",
      "elementType": "all",
      "stylers": [{ "visibility": "off" }]
    },
    {
      "featureType": "transit",
      "elementType": "all",
      "stylers": [{ "visibility": "off" }]
    },
    {
      "featureType": "road",
      "elementType": "geometry",
      "stylers": [{ "color": "#38414e" }]
    },
    {
      "featureType": "road",
      "elementType": "geometry.stroke",
      "stylers": [{ "color": "#212a37" }]
    },
    {
      "featureType": "road",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#9ca5b3" }]
    },
    {
      "featureType": "water",
      "elementType": "geometry",
      "stylers": [{ "color": "#17263c" }]
    }
  ],
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true
};

interface GoogleMapComponentProps {
  className?: string;
}

const GoogleMapComponent: React.FC<GoogleMapComponentProps> = ({ className }) => {
  const { 
    mapCenter, 
    mapZoom, 
    userLocation, 
    emergencyServices, 
    customMarkers,
    routes,
    calculateRoute,
    selectService,
    addCustomMarker,
    toggleAddingMarker
  } = useMapStore();

  const [selectedMarker, setSelectedMarker] = useState<{
    id: string;
    position: google.maps.LatLngLiteral;
    title: string;
    content: string;
  } | null>(null);

  // Load Google Maps API with Places library using constant libraries array
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    console.info("Google Maps loaded successfully");
    setMap(map);
    
    // Expose map for screenshot capability
    (window as any).__googleMap = map;
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
    (window as any).__googleMap = null;
  }, []);

  // Handle marker clicking
  const handleMarkerClick = (marker: any, isService: boolean, isCustom: boolean) => {
    if (isService) {
      const service = emergencyServices.find(s => s.id === marker.id);
      if (service) {
        selectService(service);
        const tabsElement = document.querySelector('[value="results"]') as HTMLButtonElement;
        if (tabsElement) {
          tabsElement.click();
        }
      }
    } else {
      let title = '';
      let content = '';
      
      if (marker.id === 'user-location') {
        title = 'Project Location';
        content = userLocation?.metadata ? 
          `Project Number: ${userLocation.metadata.projectNumber || 'N/A'}<br/>
          Region: ${userLocation.metadata.region || 'N/A'}<br/>
          Project Type: ${userLocation.metadata.projectType || 'N/A'}` : '';
      } else if (isCustom) {
        const customMarker = customMarkers.find(m => m.id === marker.id);
        if (customMarker) {
          title = customMarker.name;
          content = customMarker.metadata ? 
            `Project Number: ${customMarker.metadata.projectNumber || 'N/A'}<br/>
            Region: ${customMarker.metadata.region || 'N/A'}<br/>
            Project Type: ${customMarker.metadata.projectType || 'N/A'}` : '';
        }
      }
      
      setSelectedMarker({
        id: marker.id,
        position: { lat: marker.latitude || marker.lat, lng: marker.longitude || marker.lng },
        title,
        content
      });
    }
  };

  // Handle map click for adding markers
  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    const { addingMarker } = useMapStore.getState();
    
    if (addingMarker && e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      
      addCustomMarker({
        name: 'New Marker',
        latitude: lat,
        longitude: lng,
        color: '#3B82F6',
      });
      
      toggleAddingMarker();
    }
  }, [addCustomMarker, toggleAddingMarker]);

  // Get marker icon based on service type
  const getMarkerIcon = (service: EmergencyService) => {
    const type = service.type.toLowerCase();
    
    // If this is a hospital without an ER that has a redirect, use a different icon or modify the existing one
    if (type.includes('hospital') && 
        service.verification?.hasEmergencyRoom === false && 
        service.redirectHospitalId) {
      // Return a modified hospital icon to indicate redirection
      return 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="#E53935">
          <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-7 12h-2v-4H7V9h3V7h2v2h3v2h-3v4zm-3-9h4v2h-4V6z"/>
          <path d="M10 14h4l-2 3z" fill="#FFC107"/>
        </svg>
      `);
    }
    
    if (type.includes('hospital')) return '/hospital-marker.svg';
    if (type.includes('ems') || type.includes('ambulance')) return '/ems-marker.svg';
    if (type.includes('fire')) return '/fire-marker.svg';
    if (type.includes('law') || type.includes('police')) return '/law-marker.svg';
    return '/hospital-marker.svg';
  };

  // Listen for addingMarker changes
  useEffect(() => {
    if (!map) return;
    
    const { addingMarker } = useMapStore.getState();
    
    if (addingMarker) {
      map.setOptions({ draggableCursor: 'crosshair' });
    } else {
      map.setOptions({ draggableCursor: '' });
    }
    
    return () => {
      if (map) {
        map.setOptions({ draggableCursor: '' });
      }
    };
  }, [map, useMapStore.getState().addingMarker]);

  // Debug log for userLocation
  useEffect(() => {
    if (userLocation) {
      console.log("User location in map component:", userLocation);
    } else {
      console.log("User location is null in map component");
    }
  }, [userLocation]);

  if (!isLoaded) return <div className="h-full w-full flex items-center justify-center">Loading Maps...</div>;

  // Add default center coordinates if mapCenter is undefined
  const center = mapCenter ? { lat: mapCenter[0], lng: mapCenter[1] } : { lat: 37.7749, lng: -122.4194 };

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={mapZoom}
      options={mapOptions}
      onLoad={onLoad}
      onUnmount={onUnmount}
      onClick={handleMapClick}
      data-map-container="true"
      data-map-type="google"
      data-has-routes={routes.length > 0 ? "true" : "false"}
      data-routes-count={routes.length.toString()}
    >
      {/* User Location Marker */}
      {userLocation && (
        <Marker 
          position={{ lat: userLocation.latitude, lng: userLocation.longitude }}
          icon={{
            url: 'data:image/svg+xml;base64,' + btoa(`
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="8" fill="#4ade80" stroke="#ffffff" stroke-width="2" />
              </svg>
            `),
            scaledSize: new google.maps.Size(24, 24),
            anchor: new google.maps.Point(12, 12)
          }}
          onClick={() => handleMarkerClick({
            id: 'user-location', 
            latitude: userLocation.latitude, 
            longitude: userLocation.longitude
          }, false, false)}
        />
      )}

      {/* Emergency Service Markers */}
      {emergencyServices.map(service => {
        // Determine if this service has a redirection (no ER, redirects to another hospital)
        const hasRedirect = service.verification?.hasEmergencyRoom === false && service.redirectHospitalId;
        
        // Find the redirect hospital if applicable
        const redirectHospital = hasRedirect ? 
          emergencyServices.find(h => h.id === service.redirectHospitalId) : undefined;
        
        return (
          <Marker
            key={service.id}
            position={{ lat: service.latitude, lng: service.longitude }}
            icon={{
              url: getMarkerIcon(service),
              scaledSize: new google.maps.Size(30, 30),
              anchor: new google.maps.Point(15, 15)
            }}
            onClick={() => handleMarkerClick(service, true, false)}
            title={hasRedirect ? `${service.name} (Redirects to ${redirectHospital?.name || 'another hospital'})` : service.name}
          />
        );
      })}

      {/* Custom Markers */}
      {customMarkers.map(marker => (
        <Marker
          key={marker.id}
          position={{ lat: marker.latitude, lng: marker.longitude }}
          icon={{
            url: 'data:image/svg+xml;base64,' + btoa(`
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="${marker.color}" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            `),
            scaledSize: new google.maps.Size(36, 36),
            anchor: new google.maps.Point(18, 18)
          }}
          onClick={() => handleMarkerClick(marker, false, true)}
        />
      ))}

      {/* Route Polylines */}
      {routes.map((route: Route) => (
        <Polyline
          key={route.id}
          path={route.points.map(point => ({ lat: point.latitude, lng: point.longitude }))}
          options={{
            strokeColor: '#FF3B30',
            strokeOpacity: 0.8,
            strokeWeight: 5,
            geodesic: true
          }}
        />
      ))}

      {/* InfoWindow for selected marker */}
      {selectedMarker && (
        <InfoWindow
          position={selectedMarker.position}
          onCloseClick={() => setSelectedMarker(null)}
        >
          <div className="p-2 max-w-xs">
            <h3 className="font-bold text-black">{selectedMarker.title}</h3>
            <div className="text-gray-700 text-sm mt-1" 
              dangerouslySetInnerHTML={{ __html: selectedMarker.content }} 
            />
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
};

export default GoogleMapComponent;
