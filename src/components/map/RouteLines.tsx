
import React from 'react';
import { Polyline } from 'react-leaflet';
import { Route } from '../../types/mapTypes';

interface RouteLinesProps {
  routes: Route[];
}

const RouteLines: React.FC<RouteLinesProps> = ({ routes }) => {
  return (
    <>
      {routes.map((route) => (
        <Polyline
          key={route.id}
          positions={route.points.map(point => [point.latitude, point.longitude])}
          color="#3B82F6"
          weight={4}
          opacity={0.7}
        />
      ))}
    </>
  );
};

export default RouteLines;
