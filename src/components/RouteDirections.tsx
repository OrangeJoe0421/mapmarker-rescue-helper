
import React from 'react';
import { Route, EmergencyService } from '@/types/mapTypes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigation, Clock, ArrowRight, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RouteDirectionsProps {
  route: Route;
  service: EmergencyService | null;
}

const RouteDirections: React.FC<RouteDirectionsProps> = ({ route, service }) => {
  if (!route || !service) {
    return null;
  }

  // Check if we have detailed steps or just using fallback
  const hasDetailedDirections = route.steps && route.steps.length > 0;
  
  // Debug log to verify if steps are available
  console.log(`RouteDirections: Route has ${hasDetailedDirections ? route.steps!.length : 0} steps`);
  if (hasDetailedDirections && route.steps) {
    console.log("Sample step:", route.steps[0]);
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
        {!hasDetailedDirections && (
          <Alert variant="destructive" className="mb-3 bg-amber-50 text-amber-800 border-amber-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Using simplified directions. Detailed turn-by-turn directions could not be retrieved.
            </AlertDescription>
          </Alert>
        )}
        
        <ol className="space-y-3">
          <li className="flex items-start gap-3 pb-2 border-b">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground font-medium">
              1
            </div>
            <div>
              <p className="text-sm font-medium">Start at project location</p>
            </div>
          </li>
          
          {hasDetailedDirections ? (
            // Detailed Google Maps directions
            route.steps!.map((step, idx) => (
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
            ))
          ) : (
            // Fallback simple directions when Google Maps API fails
            <li className="flex items-start gap-3 pb-2 border-b">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground font-medium">
                2
              </div>
              <div>
                <p className="text-sm">
                  Follow the route for {route.distance.toFixed(2)} km (approximately {Math.floor(route.duration)} minutes)
                </p>
              </div>
            </li>
          )}
          
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
