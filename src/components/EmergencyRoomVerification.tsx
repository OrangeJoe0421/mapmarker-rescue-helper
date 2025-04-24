
import React, { useState } from 'react';
import { Check, Calendar, AlertCircle } from 'lucide-react';
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
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Handle both service object and service ID
  const serviceId = typeof service === 'string' ? service : service.id;
  const serviceObject = typeof service === 'string' 
    ? emergencyServices.find(s => s.id === service)
    : service;
  
  // If we couldn't resolve the service, return null
  if (!serviceObject) return null;
  
  const handleVerificationChange = async (checked: boolean) => {
    setIsVerifying(true);
    try {
      await verifyEmergencyRoom(serviceId, checked);
    } finally {
      setIsVerifying(false);
    }
  };

  // Only render for Hospital service types
  const serviceType = serviceObject.type || '';
  if (!serviceType.toLowerCase().includes('hospital')) {
    return null;
  }

  // Use hasER prop if provided, otherwise fall back to verification from the service object
  const isERVerified = hasER !== undefined 
    ? hasER
    : serviceObject.verification?.hasEmergencyRoom || false;

  // Format the verification date if it exists
  const formattedDate = serviceObject.verification?.verifiedAt 
    ? format(new Date(serviceObject.verification.verifiedAt), 'MMM d, yyyy')
    : null;

  return (
    <Card className={`mt-2 ${isERVerified ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-muted/50'}`}>
      <CardContent className="p-3">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id={`er-verification-${serviceId}`}
              checked={isERVerified}
              onCheckedChange={handleVerificationChange}
              disabled={isVerifying}
              className={isERVerified ? "border-emerald-500 text-emerald-500" : ""}
            />
            <Label 
              htmlFor={`er-verification-${serviceId}`}
              className={`text-sm font-medium cursor-pointer ${isERVerified ? "text-emerald-700 dark:text-emerald-400" : ""}`}
            >
              {isVerifying ? 'Saving...' : 'Verified Emergency Room'}
            </Label>
            
            {isERVerified && (
              <Check className="h-4 w-4 text-emerald-500" />
            )}
            
            {!isERVerified && (
              <AlertCircle className="h-4 w-4 text-amber-500" />
            )}
          </div>
          
          {formattedDate && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 mr-1" />
              <span>
                Verified on {formattedDate}
              </span>
            </div>
          )}
          
          {isERVerified && (
            <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mt-1">
              This hospital has been verified to have an emergency room.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EmergencyRoomVerification;
