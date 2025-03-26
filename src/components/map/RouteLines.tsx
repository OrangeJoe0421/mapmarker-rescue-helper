
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
          // Use explicit PointTuple arrays for padding to fix type errors
          const paddingOptions = { 
            // Explicitly define as [number, number] tuples to fix type errors
            paddingTopLeft: [150, 150] as [number, number],
            paddingBottomRight: [150, 150] as [number, number],
            maxZoom: 18
          };
          
          // First, we'll do a hard reset of the map view
          map.invalidateSize({ pan: false });
          
          // Then fit bounds with our padding
          map.fitBounds(allPoints as [number, number][], paddingOptions);
          
          // Signal to the capture service that the map view has changed
          mapCaptureService.markCaptureStaleDueToRouteChange();
          
          // Force multiple redraws with slight delays between them
          setTimeout(() => {
            // Force a redraw by toggling visibility
            setIsVisible(false);
            
            // After a short delay, restore visibility and redraw map
            setTimeout(() => {
              setIsVisible(true);
              map.invalidateSize({ pan: false });
              
              // Fit bounds again after visibility is restored
              setTimeout(() => {
                map.fitBounds(allPoints as [number, number][], paddingOptions);
                map.invalidateSize({ pan: false });
              }, 200);
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
                // Add a unique class for targeting with CSS
                pathElement.classList.add('capture-route-line');
                // Add data attributes for enhanced styling
                pathElement.dataset.routeId = route.id;
                pathElement.dataset.pointsCount = route.points.length.toString();
                
                // Add inline SVG styling directly
                pathElement.setAttribute('stroke', '#FF3B30');
                pathElement.setAttribute('stroke-width', '6');
                pathElement.setAttribute('stroke-opacity', '1');
                pathElement.setAttribute('stroke-linecap', 'round');
                pathElement.setAttribute('stroke-linejoin', 'round');
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
