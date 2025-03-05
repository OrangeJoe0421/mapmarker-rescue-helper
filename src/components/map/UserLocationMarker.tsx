
import React, { useEffect } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { userIcon } from './MapIcons';
import { UserLocation } from '../../types/mapTypes';

interface UserLocationMarkerProps {
  userLocation: UserLocation;
}

const UserLocationMarker: React.FC<UserLocationMarkerProps> = ({ userLocation }) => {
  useEffect(() => {
    console.log('Rendering UserLocationMarker with location:', userLocation);
  }, [userLocation]);

  // Make sure we have valid location data
  if (!userLocation || typeof userLocation.latitude !== 'number' || typeof userLocation.longitude !== 'number') {
    console.error('Invalid user location data:', userLocation);
    return null;
  }

  // Create the position array for the marker
  const position: [number, number] = [userLocation.latitude, userLocation.longitude];

  return (
    <Marker
      position={position}
      icon={userIcon}
      zIndexOffset={1000} // Ensure user marker is on top of other markers
    >
      <Popup>
        <div className="user-location-popup">
          <h3 className="font-bold">Your Location</h3>
          <p className="text-xs mt-1">
            {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
          </p>
          {userLocation.metadata && (
            <div className="mt-2 text-xs border-t pt-2">
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
        </div>
      </Popup>
    </Marker>
  );
};

export default UserLocationMarker;
