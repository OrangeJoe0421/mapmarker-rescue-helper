
import React, { useEffect } from 'react';
import { useMapStore } from '@/store/useMapStore';
import ViewRouteDetailsButton from './ViewRouteDetailsButton';

interface ServiceRouteDetailsProps {
  serviceId: string;
}

const ServiceRouteDetails: React.FC<ServiceRouteDetailsProps> = ({ serviceId }) => {
  const { routes, emergencyServices } = useMapStore();
  
  // Find the service by ID
  const service = emergencyServices.find(s => s.id === serviceId);
  
  // Find the route for this service
  const route = routes.find(r => r.fromId === serviceId);
  
  useEffect(() => {
    // Debug info to help troubleshoot component visibility
    console.log(`ServiceRouteDetails - serviceId: ${serviceId}`);
    console.log('Service found:', service?.name, 'type:', service?.type);
    console.log('Route found:', route?.id);
  }, [serviceId, service, route]);
  
  // Show for all services with routes
  if (!route || !service) {
    return null;
  }

  return (
    <div className="mt-2 space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-muted-foreground">Distance:</span>
        <span>{route.distance.toFixed(2)} km</span>
      </div>
      
      {route.duration && (
        <div className="flex justify-between text-sm">
          <span className="font-medium text-muted-foreground">Travel time:</span>
          <span>{Math.floor(route.duration)} min {Math.round((route.duration % 1) * 60)} sec</span>
        </div>
      )}
      
      <ViewRouteDetailsButton serviceId={serviceId} />
    </div>
  );
};

export default ServiceRouteDetails;
