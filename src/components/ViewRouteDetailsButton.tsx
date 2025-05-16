
import React, { useState } from 'react';
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
  
  // Only show for hospitals with routes
  const isHospital = service?.type?.toLowerCase().includes('hospital') || 
                     service?.type?.toLowerCase().includes('medical');
  
  if (!service || !route || !isHospital) {
    return null;
  }

  return (
    <>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => setDialogOpen(true)}
        className="mt-2 w-full"
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
