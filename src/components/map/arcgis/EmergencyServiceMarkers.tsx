
import React, { useEffect } from 'react';
import Point from '@arcgis/core/geometry/Point';
import Graphic from '@arcgis/core/Graphic';
import { EmergencyService } from '../../../types/mapTypes';
import { getServiceMarkerSymbol } from '../../../utils/arcgis/config';

interface EmergencyServiceMarkersProps {
  services: EmergencyService[];
  graphicsLayer: __esri.GraphicsLayer | null;
}

const EmergencyServiceMarkers: React.FC<EmergencyServiceMarkersProps> = ({ 
  services, 
  graphicsLayer 
}) => {
  useEffect(() => {
    if (!graphicsLayer) return;
    
    // Remove any existing service markers
    const existingMarkers = graphicsLayer.graphics.filter(g => {
      const attrs = g.attributes;
      return attrs && attrs.type === "service";
    });
    
    existingMarkers.forEach(marker => {
      graphicsLayer.remove(marker);
    });
    
    // Add new markers for each service
    services.forEach(service => {
      const point = new Point({
        longitude: service.longitude,
        latitude: service.latitude
      });
      
      // Get the appropriate marker symbol based on service type
      const markerSymbol = getServiceMarkerSymbol(service.type);
      
      const graphic = new Graphic({
        geometry: point,
        symbol: markerSymbol,
        attributes: {
          id: service.id,
          type: "service",
          name: service.name,
          serviceType: service.type
        },
        popupTemplate: {
          title: "{name}",
          content: [
            {
              type: "fields",
              fieldInfos: [
                { fieldName: "serviceType", label: "Type" }
              ]
            }
          ]
        }
      });
      
      graphicsLayer.add(graphic);
    });
  }, [services, graphicsLayer]);
  
  return null;
};

export default EmergencyServiceMarkers;
