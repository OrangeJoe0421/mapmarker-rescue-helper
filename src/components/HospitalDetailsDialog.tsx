import React, { useState } from 'react';
import { 
  DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { EmergencyService } from '@/types/mapTypes';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon, ExternalLink, Phone } from 'lucide-react';

interface HospitalDetailsDialogProps {
  service: EmergencyService;
}

const HospitalDetailsDialog: React.FC<HospitalDetailsDialogProps> = ({ service }) => {
  console.log('HospitalDetailsDialog rendering for:', service.name);
  console.log('Initial verification data:', service.verification);

  const [hasER, setHasER] = useState<boolean | undefined>(service.verification?.hasEmergencyRoom);
  const [verifiedDate, setVerifiedDate] = useState<Date | undefined>(
    service.verification?.verifiedAt ? new Date(service.verification.verifiedAt) : undefined
  );
  const [comments, setComments] = useState<string>(service.verification?.comments || '');
  const [googleMapsLink, setGoogleMapsLink] = useState<string>(service.googleMapsLink || '');
  const [phone, setPhone] = useState<string>(service.phone || '');
  const [isLoading, setIsLoading] = useState(false);
  
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
      console.log(`Verifying ${service.name}, hasER: ${hasER}, date: ${verifiedDate}, comments: ${comments}, googleMapsLink: ${googleMapsLink}, phone: ${phone}`);
      
      // Update the database with verification status
      const { error } = await supabase
        .from('emergency_services')
        .update({
          has_emergency_room: hasER,
          verified_at: verifiedDate.toISOString(),
          comments: comments || null,
          google_maps_link: googleMapsLink || null,
          phone: phone || null
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
      service.googleMapsLink = googleMapsLink;
      service.phone = phone;
      
      toast.success(`Successfully verified ${service.name}`);
    } catch (error) {
      console.error('Error verifying hospital:', error);
      toast.error("Failed to update verification status");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Hospital Details</DialogTitle>
        <DialogDescription>
          Verify emergency room status and other details for {service.name}
          {service.address && (
            <div className="mt-1 text-muted-foreground text-xs">
              {service.address}
            </div>
          )}
          {service.googleMapsLink && (
            <div className="mt-1 flex items-center gap-1 text-blue-600 text-xs">
              <ExternalLink className="h-3 w-3" />
              <a 
                href={service.googleMapsLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:underline"
              >
                Google Link
              </a>
            </div>
          )}
        </DialogDescription>
      </DialogHeader>
      
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <h4 className="font-medium">Emergency Room Status</h4>
          <RadioGroup 
            value={hasER === true ? "yes" : hasER === false ? "no" : undefined}
            onValueChange={(value) => setHasER(value === "yes")}
            className="space-y-1"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id={`details-er-yes-${service.id}`} />
              <label htmlFor={`details-er-yes-${service.id}`} className="text-sm">
                Yes, emergency room available
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id={`details-er-no-${service.id}`} />
              <label htmlFor={`details-er-no-${service.id}`} className="text-sm">
                No emergency room
              </label>
            </div>
          </RadioGroup>
        </div>
        
        <div className="space-y-2">
          <h4 className="font-medium">Date Verified</h4>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !verifiedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
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

        <div className="space-y-2">
          <h4 className="font-medium">Phone Number</h4>
          <div className="flex gap-2 items-center">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="(123) 456-7890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="font-medium">Comments</h4>
          <Textarea 
            placeholder="Add any additional information about this hospital"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="resize-none"
            rows={3}
          />
        </div>
      </div>
      
      <DialogFooter>
        <Button
          type="submit"
          onClick={handleVerify}
          disabled={isLoading || hasER === undefined || !verifiedDate}
        >
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default HospitalDetailsDialog;
