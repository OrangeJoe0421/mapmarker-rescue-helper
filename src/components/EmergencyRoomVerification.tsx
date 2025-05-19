
import React, { useState } from 'react';
import { EmergencyService } from '@/types/mapTypes';
import { Button } from '@/components/ui/button';
import { Shield, ShieldCheck, ShieldX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface EmergencyRoomVerificationProps {
  service: EmergencyService;
}

const EmergencyRoomVerification: React.FC<EmergencyRoomVerificationProps> = ({ service }) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasER, setHasER] = useState<boolean | undefined>(service.verification?.hasEmergencyRoom);
  const [isLoading, setIsLoading] = useState(false);
  
  // Check if the service type is a hospital (case-insensitive)
  const isHospital = service.type === 'Hospital' || service.type.toLowerCase().includes('hospital');
  
  // Only show for Hospital type services 
  if (!isHospital) {
    return null;
  }

  console.log('Rendering EmergencyRoomVerification for hospital:', service.name);
  console.log('Verification status:', service.verification);

  const handleVerify = async () => {
    if (hasER === undefined) {
      toast.error("Please select whether this hospital has an emergency room");
      return;
    }
    
    setIsLoading(true);
    try {
      console.log(`Verifying ${service.name}, hasER: ${hasER}`);
      
      // Update the database with verification status
      const { error } = await supabase
        .from('emergency_services')
        .update({
          has_emergency_room: hasER,
          verified_at: new Date().toISOString()
        })
        .eq('id', service.id);
      
      if (error) {
        throw error;
      }
      
      // Update local service data
      service.verification = {
        hasEmergencyRoom: hasER,
        verifiedAt: new Date()
      };
      
      toast.success(`Successfully verified ${service.name}`);
      setIsVerifying(false);
    } catch (error) {
      console.error('Error verifying hospital:', error);
      toast.error("Failed to update verification status");
    } finally {
      setIsLoading(false);
    }
  };

  const getVerificationStatus = () => {
    if (!service.verification?.verifiedAt) {
      return "Not verified";
    }
    
    const verifiedDate = new Date(service.verification.verifiedAt);
    const timeAgo = Math.floor((new Date().getTime() - verifiedDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return `Verified ${timeAgo} days ago`;
  };

  return (
    <div className="mt-3 space-y-2 border-t pt-2">
      {!isVerifying ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs">
            {service.verification?.verifiedAt ? (
              service.verification.hasEmergencyRoom ? (
                <ShieldCheck className="h-4 w-4 text-green-500" />
              ) : (
                <ShieldX className="h-4 w-4 text-red-500" />
              )
            ) : (
              <Shield className="h-4 w-4 text-muted-foreground" />
            )}
            <span>
              {service.verification?.verifiedAt
                ? `ER ${service.verification.hasEmergencyRoom ? 'Available' : 'Not Available'} - ${getVerificationStatus()}`
                : 'ER status not verified'}
            </span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsVerifying(true)}
            className="whitespace-nowrap"
          >
            Verify
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-sm font-medium">Does this hospital have an emergency room?</div>
          <RadioGroup 
            value={hasER === true ? "yes" : hasER === false ? "no" : undefined}
            onValueChange={(value) => setHasER(value === "yes")}
            className="space-y-1"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id={`has-er-${service.id}`} />
              <label htmlFor={`has-er-${service.id}`} className="text-sm">
                Yes, emergency room available
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id={`no-er-${service.id}`} />
              <label htmlFor={`no-er-${service.id}`} className="text-sm">
                No emergency room
              </label>
            </div>
          </RadioGroup>
          <div className="flex gap-2">
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleVerify}
              disabled={isLoading || hasER === undefined}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "Saving..." : "Save"}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsVerifying(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyRoomVerification;
