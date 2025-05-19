
import React, { useState } from 'react';
import { EmergencyService } from '@/types/mapTypes';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { toast } from 'sonner';

interface EmergencyRoomVerificationProps {
  service: EmergencyService;
  onVerificationChange?: (hasER: boolean) => void;
}

const EmergencyRoomVerification: React.FC<EmergencyRoomVerificationProps> = ({ 
  service,
  onVerificationChange
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasEmergencyRoom, setHasEmergencyRoom] = useState<boolean | null>(
    service.verification?.hasEmergencyRoom || null
  );

  const updateVerification = async (checked: boolean | "indeterminate") => {
    if (typeof checked !== "boolean") return;
    
    setIsUpdating(true);
    setHasEmergencyRoom(checked);
    
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('emergency_services')
        .update({ 
          has_emergency_room: checked,
          verified_at: now
        })
        .eq('id', service.id);
        
      if (error) {
        throw error;
      }
      
      // Update local state to reflect the changes
      service.verification = {
        hasEmergencyRoom: checked,
        verifiedAt: new Date()
      };
      
      if (onVerificationChange) {
        onVerificationChange(checked);
      }
      
      toast.success(`Emergency room status updated for ${service.name}`);
    } catch (error) {
      console.error('Error updating verification:', error);
      toast.error('Failed to update emergency room verification');
      // Revert the UI state
      setHasEmergencyRoom(service.verification?.hasEmergencyRoom || null);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-start space-x-2 mb-2">
      <Checkbox 
        id="emergency-room-checkbox"
        checked={!!hasEmergencyRoom}
        disabled={isUpdating}
        onCheckedChange={updateVerification}
      />
      <div className="grid gap-1.5 leading-none">
        <Label
          htmlFor="emergency-room-checkbox"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Has Emergency Room
        </Label>
        <p className="text-xs text-muted-foreground">
          {service.verification?.verifiedAt 
            ? `Verified on ${new Date(service.verification.verifiedAt).toLocaleDateString()}`
            : 'Not verified yet'}
        </p>
      </div>
    </div>
  );
};

export default EmergencyRoomVerification;
