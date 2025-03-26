
import React, { useEffect, useRef } from 'react';
import { Polyline, useMap } from 'react-leaflet';
import { Route } from '../../types/mapTypes';

interface RouteLinesProps {
  routes: Route[];
}

const RouteLines: React.FC<RouteLinesProps> = ({ routes }) => {
  const map = useMap();
  const routeRefs = useRef<Array<L.Polyline | null>>([]);
  
  // When routes change, ensure they're visible and properly styled
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
          // Add some padding to the bounds to ensure routes are visible
          map.fitBounds(allPoints as [number, number][], { padding: [50, 50] });
          
          // Add a bit of delay to ensure the map has updated before potential capture
          setTimeout(() => {
            // Force a repaint of route elements
            routeRefs.current.forEach(routeRef => {
              if (routeRef && routeRef.getElement()) {
                const el = routeRef.getElement();
                if (el) {
                  // Type assertion to ensure the element is treated as HTMLElement
                  const htmlElement = el as HTMLElement;
                  htmlElement.style.stroke = '#FF3B30';
                  htmlElement.style.strokeWidth = '6px';
                  htmlElement.style.opacity = '1';
                }
              }
            });
          }, 200);
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
              
              // Apply additional attributes that help with capture
              if (el.getElement()) {
                const pathElement = el.getElement();
                if (pathElement) {
                  pathElement.setAttribute('data-route-line', 'true');
                  pathElement.setAttribute('class', (pathElement.getAttribute('class') || '') + ' route-line');
                  
                  // Type assertion to ensure the element is treated as HTMLElement
                  const htmlElement = pathElement as HTMLElement;
                  // Apply inline styles for better visibility during capture
                  htmlElement.style.stroke = '#FF3B30';  // Bright red
                  htmlElement.style.strokeWidth = '6px'; // Thicker lines
                  htmlElement.style.opacity = '1';       // Full opacity
                }
              }
            }
          }}
          color="#FF3B30" // Bright red for better visibility
          weight={6} // Thicker lines
          opacity={1} // Full opacity
          className="route-line"
          pathOptions={{
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
