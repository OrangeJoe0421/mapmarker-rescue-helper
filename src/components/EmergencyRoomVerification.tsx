
import React, { useState } from 'react';
import { EmergencyService } from '@/types/mapTypes';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon, CheckCircle, XCircle } from 'lucide-react';

interface EmergencyRoomVerificationProps {
  service: EmergencyService;
  onVerificationUpdate?: (updated: boolean) => void;
}

const EmergencyRoomVerification: React.FC<EmergencyRoomVerificationProps> = ({ 
  service,
  onVerificationUpdate 
}) => {
  const [hasER, setHasER] = useState<boolean | undefined>(service.verification?.hasEmergencyRoom);
  const [verifiedDate, setVerifiedDate] = useState<Date | undefined>(
    service.verification?.verifiedAt ? new Date(service.verification.verifiedAt) : new Date()
  );
  const [comments, setComments] = useState<string>(service.verification?.comments || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleVerify = async () => {
    if (hasER === undefined) {
      toast.error("Please select whether this hospital has an emergency room");
      return;
    }

    if (!verifiedDate) {
      toast.error("Please select a verification date");
      return;
    }
    
    setIsLoading(true);
    try {
      console.log(`Verifying ${service.name}, hasER: ${hasER}, date: ${verifiedDate}, comments: ${comments}`);
      
      // Update the database with verification status
      const { error } = await supabase
        .from('emergency_services')
        .update({
          has_emergency_room: hasER,
          verified_at: verifiedDate.toISOString(),
          comments: comments || null
        })
        .eq('id', service.id);
      
      if (error) {
        throw error;
      }
      
      // Update local service data
      service.verification = {
        hasEmergencyRoom: hasER,
        verifiedAt: verifiedDate,
        comments: comments
      };
      
      toast.success(`Successfully verified ${service.name}`);
      
      // Notify parent that verification was updated
      if (onVerificationUpdate) {
        onVerificationUpdate(true);
      }
      
      // Collapse the verification form after successful verification
      setIsExpanded(false);
    } catch (error) {
      console.error('Error verifying hospital:', error);
      toast.error("Failed to update verification status");
    } finally {
      setIsLoading(false);
    }
  };

  // Only show verification for hospitals
  if (!service.type.toLowerCase().includes('hospital')) {
    return null;
  }

  // Simple status display when collapsed
  if (!isExpanded) {
    return (
      <div className="mt-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {service.verification?.hasEmergencyRoom !== undefined ? (
              service.verification.hasEmergencyRoom ? (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">ER Available</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-600">
                  <XCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">No ER</span>
                </div>
              )
            ) : (
              <div className="text-sm text-muted-foreground">ER Status: Unknown</div>
            )}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs"
            onClick={() => setIsExpanded(true)}
          >
            Update ER Info
          </Button>
        </div>
        {service.verification?.verifiedAt && (
          <div className="text-xs text-muted-foreground">
            Verified: {format(new Date(service.verification.verifiedAt), 'MMM d, yyyy')}
          </div>
        )}
      </div>
    );
  }

  // Full verification form when expanded
  return (
    <div className="mt-3 border rounded-md p-3 bg-muted/30 space-y-3">
      <div className="flex justify-between items-center">
        <h4 className="font-medium text-sm">Emergency Room Verification</h4>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 w-7 p-0" 
          onClick={() => setIsExpanded(false)}
        >
          <XCircle className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-2">
        <RadioGroup 
          value={hasER === true ? "yes" : hasER === false ? "no" : undefined}
          onValueChange={(value) => setHasER(value === "yes")}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id={`er-yes-${service.id}`} />
            <label htmlFor={`er-yes-${service.id}`} className="text-sm">
              Has ER
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id={`er-no-${service.id}`} />
            <label htmlFor={`er-no-${service.id}`} className="text-sm">
              No ER
            </label>
          </div>
        </RadioGroup>
      </div>
      
      <div className="space-y-1">
        <label className="text-sm font-medium">Date Verified</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "w-full justify-start text-left text-sm font-normal",
                !verifiedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-3 w-3" />
              {verifiedDate ? format(verifiedDate, "PPP") : <span>Select date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={verifiedDate}
              onSelect={setVerifiedDate}
              initialFocus
              disabled={(date) => date > new Date()}
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="space-y-1">
        <label className="text-sm font-medium">Comments</label>
        <Textarea 
          placeholder="Add any additional information"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          className="resize-none text-sm min-h-[60px]"
          rows={2}
        />
      </div>
      
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={handleVerify}
          disabled={isLoading || hasER === undefined || !verifiedDate}
        >
          {isLoading ? "Saving..." : "Save Verification"}
        </Button>
      </div>
    </div>
  );
};

export default EmergencyRoomVerification;
