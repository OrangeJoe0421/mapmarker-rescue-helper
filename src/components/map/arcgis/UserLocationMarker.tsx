
import React, { useEffect } from 'react';
import Point from '@arcgis/core/geometry/Point';
import Graphic from '@arcgis/core/Graphic';
import { UserLocation } from '../../../types/mapTypes';
import { MARKER_SYMBOLS } from '../../../utils/arcgis/config';

interface UserLocationMarkerProps {
  userLocation: UserLocation | null;
  graphicsLayer: __esri.GraphicsLayer | null;
}

const UserLocationMarker: React.FC<UserLocationMarkerProps> = ({ 
  userLocation, 
  graphicsLayer 
}) => {
  useEffect(() => {
    if (!graphicsLayer || !userLocation) return;
    
    // Remove any existing user location marker
    const existingMarkers = graphicsLayer.graphics.filter(g => {
      const attrs = g.attributes;
      return attrs && attrs.id === "user-location";
    });
    
    existingMarkers.forEach(marker => {
      graphicsLayer.remove(marker);
    });
    
    // Create a new point for the user location
    const point = new Point({
      longitude: userLocation.longitude,
      latitude: userLocation.latitude
    });
    
    // Create a graphic for the user location
    const graphic = new Graphic({
      geometry: point,
      symbol: MARKER_SYMBOLS.user,
      attributes: {
        id: "user-location",
        type: "user",
        name: "Project Location"
      },
      popupTemplate: {
        title: "Project Location",
        content: [
          {
            type: "fields",
            fieldInfos: [
              { fieldName: "name", label: "Name" }
            ]
          }
        ]
      }
    });
    
    // Add the graphic to the layer
    graphicsLayer.add(graphic);
  }, [userLocation, graphicsLayer]);
  
  return null;
};

export default UserLocationMarker;
