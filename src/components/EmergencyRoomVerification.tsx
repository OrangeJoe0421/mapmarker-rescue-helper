
import React from 'react';
import { Check, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Checkbox } from './ui/checkbox';
import { Card, CardContent } from './ui/card';
import { Label } from './ui/label';
import { EmergencyService } from '@/types/mapTypes';
import { useMapStore } from '@/store/useMapStore';

interface EmergencyRoomVerificationProps {
  service: EmergencyService | string;
  hasER?: boolean;
}

const EmergencyRoomVerification: React.FC<EmergencyRoomVerificationProps> = ({ service, hasER }) => {
  const { verifyEmergencyRoom, emergencyServices } = useMapStore();
  
  // Handle both service object and service ID
  const serviceId = typeof service === 'string' ? service : service.id;
  const serviceObject = typeof service === 'string' 
    ? emergencyServices.find(s => s.id === service)
    : service;
  
  // If we couldn't resolve the service, return null
  if (!serviceObject) return null;
  
  const handleVerificationChange = (checked: boolean) => {
    verifyEmergencyRoom(serviceId, checked);
  };

  // Only render for Hospital service types
  // Make sure to check for undefined before calling toLowerCase
  const serviceType = serviceObject.type || '';
  if (!serviceType.toLowerCase().includes('hospital')) {
    return null;
  }

  // Use hasER prop if provided, otherwise fall back to verification from the service object
  const isERVerified = hasER !== undefined 
    ? hasER
    : serviceObject.verification?.hasEmergencyRoom || false;

  return (
    <Card className="mt-2 bg-muted/50">
      <CardContent className="p-3">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id={`er-verification-${serviceId}`}
              checked={isERVerified}
              onCheckedChange={handleVerificationChange}
            />
            <Label 
              htmlFor={`er-verification-${serviceId}`}
              className="text-sm font-medium cursor-pointer"
            >
              Verified Emergency Room
            </Label>
          </div>
          
          {serviceObject.verification?.verifiedAt && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 mr-1" />
              <span>
                Verified on {format(new Date(serviceObject.verification.verifiedAt), 'MMM d, yyyy')}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EmergencyRoomVerification;
