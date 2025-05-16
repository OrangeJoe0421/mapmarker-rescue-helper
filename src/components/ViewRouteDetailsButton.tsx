
import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Route as RouteIcon } from 'lucide-react';
import { useMapStore } from '@/store/useMapStore';
import RouteDetailsDialog from './RouteDetailsDialog';

interface ViewRouteDetailsButtonProps {
  serviceId: string;
}

const ViewRouteDetailsButton: React.FC<ViewRouteDetailsButtonProps> = ({ serviceId }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { routes, emergencyServices } = useMapStore();
  
  const service = emergencyServices.find(s => s.id === serviceId);
  const route = routes.find(r => r.fromId === serviceId);
  
  useEffect(() => {
    // Debug info to help troubleshoot button visibility
    console.log(`ViewRouteDetailsButton - serviceId: ${serviceId}`);
    console.log('Service found:', service?.name, 'type:', service?.type);
    console.log('Route found:', route?.id);
    console.log('Is hospital?', service?.type?.toLowerCase().includes('hospital') || service?.type?.toLowerCase().includes('medical'));
  }, [serviceId, service, route]);
  
  // Show for all services with routes, not just hospitals
  if (!service || !route) {
    return null;
  }

  return (
    <>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => setDialogOpen(true)}
        className="mt-2 w-full bg-blue-50 hover:bg-blue-100 border-blue-200"
      >
        <RouteIcon className="mr-2 h-4 w-4" />
        View Detailed Directions
      </Button>
      
      <RouteDetailsDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        route={route}
        service={service}
      />
    </>
  );
};

export default ViewRouteDetailsButton;
