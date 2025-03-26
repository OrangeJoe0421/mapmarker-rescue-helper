
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
  
  // When routes change, ensure they're properly fitted
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
          // Apply padding with explicit type casting
          const paddingOptions = { 
            paddingTopLeft: [50, 50] as [number, number],
            paddingBottomRight: [50, 50] as [number, number],
            maxZoom: 16
          };
          
          // Fit bounds with our padding
          map.fitBounds(allPoints as [number, number][], paddingOptions);
          
          // Signal to the capture service that the map view has changed
          mapCaptureService.notifyRouteAdded(routes);
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
            if (el) {
              routeRefs.current[index] = el;
              // Get the underlying SVG element
              const pathElement = el.getElement();
              if (pathElement) {
                // Add data attributes for easier identification in html2canvas
                pathElement.classList.add('capture-route-line');
                pathElement.classList.add(`route-${route.id}`);
                pathElement.setAttribute('data-route-id', route.id);
                pathElement.setAttribute('data-is-route', 'true');
                
                // Enhance styling for better visibility in capture
                pathElement.setAttribute('stroke', '#FF3B30');
                pathElement.setAttribute('stroke-width', '8');
                pathElement.setAttribute('stroke-opacity', '1');
                pathElement.setAttribute('stroke-linecap', 'round');
                pathElement.setAttribute('stroke-linejoin', 'round');
                pathElement.style.visibility = 'visible';
                pathElement.style.display = 'block';
              }
            }
          }}
          pathOptions={{
            color: '#FF3B30',
            weight: 8,
            opacity: 1,
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />
      ))}
    </>
  );
};

export default RouteLines;
