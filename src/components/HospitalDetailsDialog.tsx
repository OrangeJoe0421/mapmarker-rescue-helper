
import React, { useState, useEffect } from 'react';
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
import { Calendar as CalendarIcon, ExternalLink, Phone, MapPin, RoutingIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMapStore } from '@/store/useMapStore';

interface HospitalDetailsDialogProps {
  service: EmergencyService;
  onClose?: () => void;
}

const HospitalDetailsDialog: React.FC<HospitalDetailsDialogProps> = ({ service, onClose }) => {
  console.log('HospitalDetailsDialog rendering for:', service.name);
  console.log('Initial verification data:', service.verification);

  const [hasER, setHasER] = useState<boolean | undefined>(service.verification?.hasEmergencyRoom);
  const [verifiedDate, setVerifiedDate] = useState<Date | undefined>(
    service.verification?.verifiedAt ? new Date(service.verification.verifiedAt) : undefined
  );
  const [comments, setComments] = useState<string>(service.verification?.comments || '');
  const [googleMapsLink, setGoogleMapsLink] = useState<string>(service.googleMapsLink || '');
  const [phone, setPhone] = useState<string>(service.phone || '');
  const [redirectHospitalId, setRedirectHospitalId] = useState<string | undefined>(service.redirectHospitalId);
  const [isLoading, setIsLoading] = useState(false);
  
  const { emergencyServices, clearRoutes, selectService, calculateRoute } = useMapStore();
  
  // Filter hospitals to exclude current one
  const otherHospitals = emergencyServices.filter(h => 
    h.id !== service.id && h.type.toLowerCase().includes('hospital')
  );
  
  // Update local state when service changes
  useEffect(() => {
    setHasER(service.verification?.hasEmergencyRoom);
    setVerifiedDate(service.verification?.verifiedAt ? new Date(service.verification.verifiedDate) : undefined);
    setComments(service.verification?.comments || '');
    setGoogleMapsLink(service.googleMapsLink || '');
    setPhone(service.phone || '');
    setRedirectHospitalId(service.redirectHospitalId);
  }, [service]);
  
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
          redirect_hospital_id: hasER === false ? redirectHospitalId || null : null // Only set redirect if no ER
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
      service.redirectHospitalId = hasER === false ? redirectHospitalId : undefined;
      
      toast.success(`Successfully verified ${service.name}`);
    } catch (error) {
      console.error('Error verifying hospital:', error);
      toast.error("Failed to update verification status");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSetAsOnlyHospital = () => {
    // Clear all existing routes
    clearRoutes();
    
    // Select this hospital
    selectService(service);
    
    // Calculate a route from this hospital to the user location
    calculateRoute(service.id, true);
    
    toast.success(`Set ${service.name} as the only hospital on map`);
    
    // Close the dialog if onClose is provided
    if (onClose) {
      onClose();
    }
  };
  
  // Find the redirect hospital name if it exists
  const redirectHospitalName = redirectHospitalId ? 
    emergencyServices.find(h => h.id === redirectHospitalId)?.name || "Unknown Hospital" : 
    undefined;

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Hospital Details</DialogTitle>
        <DialogDescription>
          Verify emergency room status and other details for {service.name}
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
        
        {/* Redirect Hospital Dropdown - Only visible if hasER is false */}
        {hasER === false && (
          <div className="space-y-2">
            <h4 className="font-medium">Redirect to Hospital</h4>
            <p className="text-xs text-muted-foreground">
              When this hospital doesn't have an emergency room, where should patients be redirected?
            </p>
            <Select
              value={redirectHospitalId || "none"}
              onValueChange={(value) => setRedirectHospitalId(value === "none" ? undefined : value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a hospital" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No redirection</SelectItem>
                {otherHospitals.map(hospital => (
                  <SelectItem key={hospital.id} value={hospital.id}>{hospital.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        <div className="space-y-2">
          <h4 className="font-medium">Address</h4>
          <div className="text-sm border rounded-md p-2 bg-muted/30">
            {service.address || 'No address available'}
          </div>

          {googleMapsLink && (
            <div className="flex gap-2 items-center">
              <MapPin className="h-4 w-4 text-muted-foreground" />
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
        
        <div className="pt-2">
          <Button 
            onClick={handleSetAsOnlyHospital}
            variant="default"
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Set as Only Hospital on Map
          </Button>
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
