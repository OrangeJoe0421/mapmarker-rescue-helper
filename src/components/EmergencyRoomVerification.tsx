
import React, { useState } from 'react';
import { EmergencyService } from '@/types/mapTypes';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, ShieldCheck, ShieldX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EmergencyRoomVerificationProps {
  service: EmergencyService;
}

const EmergencyRoomVerification: React.FC<EmergencyRoomVerificationProps> = ({ service }) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasER, setHasER] = useState<boolean | undefined>(service.verification?.hasEmergencyRoom);
  const [isLoading, setIsLoading] = useState(false);

  // Check if this is a hospital service - look for "hospital" in the type string (case insensitive)
  const isHospital = service.type.toLowerCase().includes('hospital');
  
  // Only show for hospital type services
  if (!isHospital) {
    return null;
  }

  const handleVerify = async () => {
    if (hasER === undefined) {
      toast.error("Please select whether this hospital has an emergency room");
      return;
    }
    
    setIsLoading(true);
    try {
      // Update the database with verification status
      const { data, error } = await supabase
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
          >
            Verify
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-sm font-medium">Does this hospital have an emergency room?</div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="has-er" 
              checked={hasER === true}
              onCheckedChange={() => setHasER(true)}
            />
            <label htmlFor="has-er" className="text-sm">
              Yes, emergency room available
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="no-er" 
              checked={hasER === false}
              onCheckedChange={() => setHasER(false)}
            />
            <label htmlFor="no-er" className="text-sm">
              No emergency room
            </label>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleVerify}
              disabled={isLoading}
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
