
import React from 'react';
import { Check, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Checkbox } from './ui/checkbox';
import { Card, CardContent } from './ui/card';
import { Label } from './ui/label';
import { EmergencyService, useMapStore } from '@/store/useMapStore';

interface EmergencyRoomVerificationProps {
  service: EmergencyService;
}

const EmergencyRoomVerification: React.FC<EmergencyRoomVerificationProps> = ({ service }) => {
  const { verifyEmergencyRoom } = useMapStore();
  
  const handleVerificationChange = (checked: boolean) => {
    verifyEmergencyRoom(service.id, checked);
  };

  return (
    <Card className="mt-2 bg-muted/50">
      <CardContent className="p-3">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id={`er-verification-${service.id}`}
              checked={service.verification?.hasEmergencyRoom || false}
              onCheckedChange={handleVerificationChange}
            />
            <Label 
              htmlFor={`er-verification-${service.id}`}
              className="text-sm font-medium cursor-pointer"
            >
              Verified Emergency Room
            </Label>
          </div>
          
          {service.verification?.verifiedAt && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 mr-1" />
              <span>
                Verified on {format(new Date(service.verification.verifiedAt), 'MMM d, yyyy')}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EmergencyRoomVerification;
