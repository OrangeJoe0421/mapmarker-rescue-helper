
import React, { useEffect } from 'react';
import Polyline from '@arcgis/core/geometry/Polyline';
import Graphic from '@arcgis/core/Graphic';
import { Route } from '../../../types/mapTypes';
import { MARKER_SYMBOLS } from '../../../utils/arcgis/config';

interface RouteLinesProps {
  routes: Route[];
  routeLayer: __esri.GraphicsLayer | null;
}

const RouteLines: React.FC<RouteLinesProps> = ({ 
  routes, 
  routeLayer 
}) => {
  useEffect(() => {
    if (!routeLayer) return;
    
    // Clear all existing routes
    routeLayer.removeAll();
    
    // Add each route as a polyline
    routes.forEach(route => {
      // Convert route points to ArcGIS path format
      const paths = route.points.map(point => [point.longitude, point.latitude]);
      
      const polyline = new Polyline({
        paths: [paths]
      });
      
      const graphic = new Graphic({
        geometry: polyline,
        symbol: MARKER_SYMBOLS.route,
        attributes: {
          id: route.id,
          distance: route.distance,
          duration: route.duration
        },
        popupTemplate: {
          title: "Route",
          content: [
            {
              type: "fields",
              fieldInfos: [
                { fieldName: "distance", label: "Distance (km)" },
                { fieldName: "duration", label: "Duration (min)" }
              ]
            }
          ]
        }
      });
      
      routeLayer.add(graphic);
    });
  }, [routes, routeLayer]);
  
  return null;
};

export default RouteLines;
