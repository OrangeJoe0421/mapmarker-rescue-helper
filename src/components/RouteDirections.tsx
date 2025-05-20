
import React from 'react';
import { Route, EmergencyService } from '@/types/mapTypes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigation, Clock, ArrowRight } from 'lucide-react';

interface RouteDirectionsProps {
  route: Route;
  service: EmergencyService | null;
}

const RouteDirections: React.FC<RouteDirectionsProps> = ({ route, service }) => {
  if (!route || !route.steps || route.steps.length === 0 || !service) {
    return null;
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Navigation className="h-5 w-5" />
          <span>Directions to {service.name}</span>
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <span>{route.distance.toFixed(2)} km</span>
          </div>
          {route.duration && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{Math.floor(route.duration)} min</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3">
          <li className="flex items-start gap-3 pb-2 border-b">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground font-medium">
              1
            </div>
            <div>
              <p className="text-sm font-medium">Start at project location</p>
            </div>
          </li>
          
          {route.steps.map((step, idx) => (
            <li key={idx} className="flex items-start gap-3 pb-2 border-b">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground font-medium">
                {idx + 2}
              </div>
              <div>
                <p 
                  className="text-sm" 
                  dangerouslySetInnerHTML={{ __html: step.instructions }} 
                />
                {step.distance > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {(step.distance / 1000).toFixed(2)} km
                  </p>
                )}
              </div>
            </li>
          ))}
          
          <li className="flex items-start gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
              <ArrowRight className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium">Arrive at {service.name}</p>
              {service.address && (
                <p className="text-xs text-muted-foreground">{service.address}</p>
              )}
            </div>
          </li>
        </ol>
      </CardContent>
    </Card>
  );
};

export default RouteDirections;
