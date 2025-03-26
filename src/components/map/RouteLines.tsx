
import React, { useEffect, useRef } from 'react';
import { Polyline, useMap } from 'react-leaflet';
import { Route } from '../../types/mapTypes';
import { mapCaptureService } from '../MapCapture';

interface RouteLinesProps {
  routes: Route[];
}

const RouteLines: React.FC<RouteLinesProps> = ({ routes }) => {
  const map = useMap();
  const routeRefs = useRef<Array<L.Polyline | null>>([]);
  
  // When routes change, ensure they're visible and properly centered
  useEffect(() => {
    if (routes.length > 0) {
      // Initialize refs array to match routes length
      routeRefs.current = Array(routes.length).fill(null);
      
      // Fit map bounds to include all routes if we have routes
      const allPoints = routes.flatMap(route => 
        route.points.map(point => [point.latitude, point.longitude])
      );
      
      if (allPoints.length > 0) {
        try {
          // Add more padding to the bounds to ensure routes are fully visible
          map.fitBounds(allPoints as [number, number][], { padding: [100, 100] });
          
          // Signal to the capture service that the map view has changed
          mapCaptureService.markCaptureStaleDueToRouteChange();
          
          // Force a repaint after bounds change
          setTimeout(() => {
            map.invalidateSize();
          }, 300);
        } catch (error) {
          console.error("Error fitting bounds to routes:", error);
        }
      }
    }
  }, [routes, map]);
  
  return (
    <>
      {routes.map((route, index) => (
        <Polyline
          key={route.id}
          positions={route.points.map(point => [point.latitude, point.longitude])}
          ref={(el) => {
            // Store reference to the Polyline instance
            if (el) {
              routeRefs.current[index] = el;
              
              // Apply additional attributes for capture with SVG attributes
              if (el.getElement()) {
                const pathElement = el.getElement();
                if (pathElement) {
                  // Add data attributes for identifying routes in capture
                  pathElement.setAttribute('data-route-id', route.id);
                  pathElement.setAttribute('data-route-line', 'true');
                  pathElement.setAttribute('class', 'route-line-highlighted');
                  
                  // Use SVG specific attributes for styling
                  pathElement.setAttribute('stroke', '#FF3B30');
                  pathElement.setAttribute('stroke-width', '6');
                  pathElement.setAttribute('opacity', '1');
                  pathElement.setAttribute('stroke-linecap', 'round');
                  pathElement.setAttribute('stroke-linejoin', 'round');
                  pathElement.setAttribute('vector-effect', 'non-scaling-stroke');
                }
              }
            }
          }}
          pathOptions={{
            color: '#FF3B30', // Bright red for better visibility
            weight: 6, // Thicker lines
            opacity: 1, // Full opacity
            className: 'route-path',
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />
      ))}
    </>
  );
};

export default RouteLines;
