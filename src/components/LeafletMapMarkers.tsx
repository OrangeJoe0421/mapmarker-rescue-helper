
import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl, Polyline } from 'react-leaflet';
import { useMapStore } from '@/store/useMapStore';
import { Icon } from 'leaflet';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { RouteIcon } from 'lucide-react';

// Create custom marker icons
const createIcon = (color: string, size: [number, number] = [30, 30], className = '') => {
  return new Icon({
    iconUrl: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='${encodeURIComponent(color)}' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z'%3E%3C/path%3E%3Ccircle cx='12' cy='10' r='3'%3E%3C/circle%3E%3C/svg%3E`,
    iconSize: size,
    iconAnchor: [size[0] / 2, size[1]],
    popupAnchor: [0, -size[1] + 5],
    className: cn('transition-all duration-300 hover:scale-110', className),
  });
};

// Marker for user location
const userLocationIcon = createIcon('#10b981', [35, 35], 'animate-pulse-subtle');

// Marker for emergency services
const emergencyServiceIcon = createIcon('#ef4444');

// Marker for custom markers
const customMarkerIcon = createIcon('#3b82f6', [28, 28]);

// Marker for selected items
const selectedIcon = createIcon('#8b5cf6', [38, 38], 'animate-pulse');

type MapCenterProps = {
  position: [number, number];
  zoom: number;
};

// Component to update the map view when center changes
const MapCenterUpdater = ({ position, zoom }: MapCenterProps) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(position, zoom, {
      animate: true,
      duration: 0.8,
    });
  }, [map, position, zoom]);
  
  return null;
};

// Component to handle map clicks for adding markers
const MapClickHandler = () => {
  const map = useMap();
  const { addingMarker, addCustomMarker } = useMapStore();
  
  useEffect(() => {
    if (!addingMarker) return;
    
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const name = prompt('Enter a name for this marker:', `Custom Marker`);
      
      if (name) {
        addCustomMarker({
          name,
          latitude: lat,
          longitude: lng,
        });
      }
    };
    
    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [map, addingMarker, addCustomMarker]);
  
  return null;
};

// Custom popup content with route options
const CustomMarkerPopup = ({ marker }: { marker: any }) => {
  const { userLocation, calculateRoute } = useMapStore();
  
  const handleCalculateRoute = () => {
    calculateRoute(marker.id, true);
  };
  
  return (
    <div className="p-1 space-y-2">
      <h3 className="font-medium">{marker.name}</h3>
      <p className="text-sm text-muted-foreground">
        {marker.latitude.toFixed(6)}, {marker.longitude.toFixed(6)}
      </p>
      {userLocation && (
        <Button 
          size="sm" 
          variant="outline"
          className="w-full"
          onClick={handleCalculateRoute}
        >
          <RouteIcon className="mr-2 h-4 w-4" />
          Route to Location
        </Button>
      )}
    </div>
  );
};

const LeafletMapMarkers = () => {
  const { 
    userLocation, 
    emergencyServices, 
    customMarkers, 
    selectedService, 
    selectedMarker,
    mapCenter,
    mapZoom,
    selectService,
    selectMarker,
    routes,
    clearRoutes,
    updateCustomMarker
  } = useMapStore();

  // Prepare tiles with proper attribution
  const tileLayer = useMemo(() => (
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    />
  ), []);

  return (
    <div className="relative h-[calc(100vh-2rem)] w-full overflow-hidden rounded-xl border shadow-lg">
      <MapContainer 
        center={mapCenter} 
        zoom={mapZoom} 
        zoomControl={false}
        className="h-full w-full z-0"
      >
        {tileLayer}
        <ZoomControl position="bottomright" />
        <MapCenterUpdater position={mapCenter} zoom={mapZoom} />
        <MapClickHandler />
        
        {/* User Location Marker */}
        {userLocation && (
          <Marker 
            position={[userLocation.latitude, userLocation.longitude]} 
            icon={userLocationIcon}
          >
            <Popup>
              <div className="p-1">
                <h3 className="font-medium">Your Selected Location</h3>
                <p className="text-sm text-muted-foreground">
                  {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Emergency Services Markers */}
        {emergencyServices.map((service) => (
          <Marker 
            key={service.id} 
            position={[service.latitude, service.longitude]} 
            icon={service.id === selectedService?.id ? selectedIcon : emergencyServiceIcon}
            eventHandlers={{
              click: () => selectService(service),
            }}
          >
            <Popup>
              <div className="p-1">
                <h3 className="font-medium">{service.type}: {service.name}</h3>
                {service.road_distance && (
                  <p className="text-sm text-muted-foreground">
                    Distance: {service.road_distance.toFixed(2)} km
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Custom Markers - Now Draggable */}
        {customMarkers.map((marker) => (
          <Marker 
            key={marker.id} 
            position={[marker.latitude, marker.longitude]} 
            icon={marker.id === selectedMarker?.id ? selectedIcon : customMarkerIcon}
            draggable={true}
            eventHandlers={{
              click: () => selectMarker(marker),
              dragend: (e) => {
                const latLng = e.target.getLatLng();
                updateCustomMarker(marker.id, {
                  latitude: latLng.lat,
                  longitude: latLng.lng
                });
              }
            }}
          >
            <Popup>
              <CustomMarkerPopup marker={marker} />
            </Popup>
          </Marker>
        ))}
        
        {/* Routes */}
        {routes.map((route) => (
          <Polyline
            key={route.id}
            positions={route.points.map(point => [point.latitude, point.longitude])}
            color="#9333ea"
            weight={4}
            opacity={0.8}
            dashArray="10, 10"
          >
            <Popup>
              <div className="p-1">
                <h3 className="font-medium">Route</h3>
                <p className="text-sm text-muted-foreground">
                  Distance: {route.distance.toFixed(2)} km
                </p>
                {route.duration && (
                  <p className="text-sm text-muted-foreground">
                    Est. Duration: {Math.round(route.duration)} min
                  </p>
                )}
              </div>
            </Popup>
          </Polyline>
        ))}
      </MapContainer>
      
      {/* Route Controls */}
      {routes.length > 0 && (
        <div className="absolute right-4 bottom-16 z-10">
          <Button 
            variant="destructive" 
            size="sm"
            onClick={clearRoutes}
            className="shadow-md"
          >
            Clear Routes
          </Button>
        </div>
      )}
    </div>
  );
};

export default LeafletMapMarkers;
