
import React, { useEffect } from 'react';
import Point from '@arcgis/core/geometry/Point';
import Graphic from '@arcgis/core/Graphic';
import { CustomMarker } from '../../../types/mapTypes';
import { MARKER_SYMBOLS } from '../../../utils/arcgis/config';

interface CustomMarkersProps {
  markers: CustomMarker[];
  graphicsLayer: __esri.GraphicsLayer | null;
}

const CustomMarkers: React.FC<CustomMarkersProps> = ({ 
  markers, 
  graphicsLayer 
}) => {
  useEffect(() => {
    if (!graphicsLayer) return;
    
    // Remove any existing custom markers
    const existingMarkers = graphicsLayer.graphics.filter(g => {
      const attrs = g.attributes;
      return attrs && attrs.type === "custom";
    });
    
    existingMarkers.forEach(marker => {
      graphicsLayer.remove(marker);
    });
    
    // Add new markers for each custom marker
    markers.forEach(marker => {
      const point = new Point({
        longitude: marker.longitude,
        latitude: marker.latitude
      });
      
      // Create custom marker symbol, potentially with custom color
      const markerSymbol = {
        ...MARKER_SYMBOLS.custom,
        color: marker.color ? hexToRgb(marker.color) : MARKER_SYMBOLS.custom.color
      };
      
      const graphic = new Graphic({
        geometry: point,
        symbol: markerSymbol,
        attributes: {
          id: marker.id,
          type: "custom",
          name: marker.name
        },
        popupTemplate: {
          title: "{name}",
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
      
      graphicsLayer.add(graphic);
    });
  }, [markers, graphicsLayer]);
  
  // Helper function to convert hex color to RGB array
  const hexToRgb = (hex: string): number[] => {
    // Remove the # if present
    hex = hex.replace(/^#/, '');
    
    // Parse the hex values
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    
    return [r, g, b];
  };
  
  return null;
};

export default CustomMarkers;
