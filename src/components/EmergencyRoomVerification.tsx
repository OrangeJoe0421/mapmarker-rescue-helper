
import React, { useState, useEffect } from 'react';
import { EmergencyService } from '@/types/mapTypes';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon, CheckCircle, ExternalLink, MapPin, Phone, XCircle, Navigation } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EmergencyRoomVerificationProps {
  service: EmergencyService;
  onVerificationUpdate?: (updated: boolean) => void;
  availableHospitals?: EmergencyService[];
}

const EmergencyRoomVerification: React.FC<EmergencyRoomVerificationProps> = ({ 
  service,
  onVerificationUpdate,
  availableHospitals = []
}) => {
  const [hasER, setHasER] = useState<boolean | undefined>(service.verification?.hasEmergencyRoom);
  const [verifiedDate, setVerifiedDate] = useState<Date | undefined>(
    service.verification?.verifiedAt ? new Date(service.verification.verifiedAt) : new Date()
  );
  const [comments, setComments] = useState<string>(service.verification?.comments || '');
  const [googleMapsLink, setGoogleMapsLink] = useState<string>(service.googleMapsLink || '');
  const [phone, setPhone] = useState<string>(service.phone || '');
  const [redirectHospitalId, setRedirectHospitalId] = useState<string | null>(service.redirectHospitalId || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Update local state when service changes
  useEffect(() => {
    setHasER(service.verification?.hasEmergencyRoom);
    setVerifiedDate(service.verification?.verifiedAt ? new Date(service.verification.verifiedAt) : new Date());
    setComments(service.verification?.comments || '');
    setGoogleMapsLink(service.googleMapsLink || '');
    setPhone(service.phone || '');
    setRedirectHospitalId(service.redirectHospitalId || null);
  }, [service]);

  // Get hospitals that have ERs for redirect options
  const getRedirectOptions = () => {    
    return availableHospitals
      .filter(h => 
        // Has an ER and is not the current hospital
        h.id !== service.id && 
        h.verification?.hasEmergencyRoom === true
      )
      .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
  };

  const redirectOptions = getRedirectOptions();

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
      console.log(`Verifying ${service.name}, hasER: ${hasER}, date: ${verifiedDate}, comments: ${comments}, googleMapsLink: ${googleMapsLink}, phone: ${phone}, redirectHospitalId: ${redirectHospitalId}`);
      
      // Update the database with verification status
      const { data, error } = await supabase
        .from('emergency_services')
        .update({
          has_emergency_room: hasER,
          verified_at: verifiedDate.toISOString(),
          comments: comments || null,
          google_maps_link: googleMapsLink || null,
          phone: phone || null,
          redirect_hospital_id: !hasER ? redirectHospitalId : null // Only set redirect if hospital has no ER
        })
        .eq('id', service.id);
      
      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }
      
      console.log('Supabase update response:', data);
      
      // Update local service data
      service.verification = {
        hasEmergencyRoom: hasER,
        verifiedAt: verifiedDate,
        comments: comments
      };
      service.googleMapsLink = googleMapsLink;
      service.phone = phone;
      service.redirectHospitalId = !hasER ? redirectHospitalId : null;
      
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
                  {service.redirectHospitalId && (
                    <div className="flex items-center gap-1 text-blue-600 ml-2">
                      <Navigation className="h-3 w-3" />
                      <span className="text-xs">Redirects to another hospital</span>
                    </div>
                  )}
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
      
      {/* Redirect Hospital Selection - only show if "No ER" is selected */}
      {hasER === false && redirectOptions.length > 0 && (
        <div className="space-y-1 border-l-2 border-blue-500 pl-3">
          <label className="text-sm font-medium">Redirect to Hospital with ER</label>
          <Select
            value={redirectHospitalId || ''}
            onValueChange={(value) => setRedirectHospitalId(value || null)}
          >
            <SelectTrigger className="w-full text-sm h-8">
              <SelectValue placeholder="Select a hospital with ER..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">
                <em>No redirection</em>
              </SelectItem>
              {redirectOptions.map((hospital) => (
                <SelectItem key={hospital.id} value={hospital.id}>
                  {hospital.name} 
                  {hospital.distance && ` (${hospital.distance.toFixed(1)} km)`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Select a hospital with an ER to route emergency services to
          </p>
        </div>
      )}
      
      <div className="space-y-1">
        <label className="text-sm font-medium">Address</label>
        <div className="text-sm border rounded-md p-2 bg-muted/30">
          {service.address || 'No address available'}
        </div>

        {googleMapsLink && (
          <div className="flex gap-2 items-center">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <a 
              href={googleMapsLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline truncate"
            >
              Google Link
            </a>
          </div>
        )}
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
        <label className="text-sm font-medium">Phone Number</label>
        <div className="flex gap-2 items-center">
          <Phone className="h-3 w-3 text-muted-foreground" />
          <Input
            placeholder="(123) 456-7890"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="text-sm"
          />
        </div>
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
