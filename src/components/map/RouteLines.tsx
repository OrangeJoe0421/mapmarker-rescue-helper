
import React, { useEffect, useRef, useState } from 'react';
import { Polyline, useMap } from 'react-leaflet';
import { Route } from '../../types/mapTypes';
import { mapCaptureService } from '../MapCapture';

interface RouteLinesProps {
  routes: Route[];
}

const RouteLines: React.FC<RouteLinesProps> = ({ routes }) => {
  const map = useMap();
  const routeRefs = useRef<Array<L.Polyline | null>>([]);
  const [isVisible, setIsVisible] = useState(true);
  
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
          // Use a different padding approach with larger values for better visibility
          const paddingOptions = { 
            paddingTopLeft: [150, 150],
            paddingBottomRight: [150, 150],
            maxZoom: 18
          };
          
          map.fitBounds(allPoints as [number, number][], paddingOptions);
          
          // Signal to the capture service that the map view has changed
          mapCaptureService.markCaptureStaleDueToRouteChange();
          
          // Force multiple redraws for better consistency
          // First immediate redraw
          map.invalidateSize();
          
          // Then toggle visibility briefly to force a complete redraw
          setIsVisible(false);
          setTimeout(() => {
            setIsVisible(true);
            map.invalidateSize();
            
            // Fit bounds again after visibility is restored
            setTimeout(() => {
              map.fitBounds(allPoints as [number, number][], paddingOptions);
              map.invalidateSize();
            }, 100);
          }, 50);
        } catch (error) {
          console.error("Error fitting bounds to routes:", error);
        }
      }
    }
  }, [routes, map]);
  
  if (!isVisible) return null;
  
  return (
    <>
      {routes.map((route, index) => (
        <Polyline
          key={route.id}
          positions={route.points.map(point => [point.latitude, point.longitude])}
          ref={(el) => {
            if (el) {
              routeRefs.current[index] = el;
              const pathElement = el.getElement();
              if (pathElement) {
                // Use a custom class that we'll target with CSS
                pathElement.setAttribute('class', 'capture-route-line');
                pathElement.setAttribute('data-route-id', route.id);
              }
            }
          }}
          pathOptions={{
            color: '#FF3B30',
            weight: 6,
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
