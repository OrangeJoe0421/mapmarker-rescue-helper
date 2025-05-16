
import React, { useState } from 'react';
import { Route, EmergencyService } from '@/types/mapTypes';
import { Button } from './ui/button';
import { Route as RouteIcon } from 'lucide-react';
import RouteDetailsDialog from './RouteDetailsDialog';
import { useMapStore } from '@/store/useMapStore';

interface ViewRouteButtonProps {
  serviceId: string;
}

const ViewRouteButton: React.FC<ViewRouteButtonProps> = ({ serviceId }) => {
  const [showRouteDetails, setShowRouteDetails] = useState(false);
  const { routes, emergencyServices } = useMapStore();
  
  // Find the service by ID
  const service = emergencyServices.find(s => s.id === serviceId);
  
  // Find the route for this service
  const route = routes.find(r => r.fromId === serviceId);
  
  // Only show the button if there's a route and service
  if (!route || !service) return null;

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setShowRouteDetails(true)}
        className="h-8 px-2 text-xs"
      >
        <RouteIcon className="mr-1 h-3 w-3" />
        View Directions
      </Button>
      
      <RouteDetailsDialog
        isOpen={showRouteDetails}
        onClose={() => setShowRouteDetails(false)}
        route={route}
        service={service}
      />
    </>
  );
};

export default ViewRouteButton;
