
import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { userIcon } from './MapIcons';
import { UserLocation } from '../../types/mapTypes';

interface UserLocationMarkerProps {
  userLocation: UserLocation;
}

const UserLocationMarker: React.FC<UserLocationMarkerProps> = ({ userLocation }) => {
  return (
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
  );
};

export default UserLocationMarker;
