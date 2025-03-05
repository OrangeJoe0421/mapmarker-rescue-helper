
import React from 'react';
import { useMapStore } from '../../store/useMapStore';
import UserLocationMarker from './UserLocationMarker';
import EmergencyServiceMarkers from './EmergencyServiceMarkers';
import CustomMarkers from './CustomMarkers';
import RouteLines from './RouteLines';

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

  return (
    <>
      {/* User location marker */}
      {userLocation && (
        <UserLocationMarker userLocation={userLocation} />
      )}

      {/* Emergency services markers */}
      <EmergencyServiceMarkers 
        services={emergencyServices} 
        selectService={selectService} 
        calculateRoute={calculateRoute} 
      />

      {/* Custom markers */}
      <CustomMarkers 
        markers={customMarkers} 
        selectMarker={selectMarker} 
        updateCustomMarker={updateCustomMarker} 
        calculateRoute={calculateRoute} 
      />

      {/* Route polylines */}
      <RouteLines routes={routes} />
    </>
  );
};

export default MapMarkers;
