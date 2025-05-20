
import React, { useState, useEffect } from 'react';
import { 
  DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { EmergencyService } from '@/types/mapTypes';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Route } from 'lucide-react';
import { useMapStore } from '@/store/useMapStore';
import { EmergencyRoomStatusSection } from './hospital/EmergencyRoomStatusSection';
import { RedirectHospitalSection } from './hospital/RedirectHospitalSection';
import { VerificationDatePicker } from './hospital/VerificationDatePicker';
import { HospitalContactInfo } from './hospital/HospitalContactInfo';
import { HospitalComments } from './hospital/HospitalComments';

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
    setVerifiedDate(service.verification?.verifiedAt ? new Date(service.verification.verifiedAt) : undefined);
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
      
      // Re-calculate any existing routes that might use this service
      // to make sure redirection is applied immediately
      if (hasER === false && redirectHospitalId) {
        const existingRoute = useMapStore.getState().routes.find(r => r.fromId === service.id);
        if (existingRoute) {
          calculateRoute(service.id, true);
        }
      }
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
  
  // Function to test redirection
  const handleTestRedirection = () => {
    if (hasER === false && redirectHospitalId) {
      const redirectHospital = emergencyServices.find(h => h.id === redirectHospitalId);
      if (redirectHospital) {
        clearRoutes();
        selectService(service);
        calculateRoute(service.id, true);
        toast.info(`Testing redirection from ${service.name} to ${redirectHospital.name}`);
        
        // Close the dialog if onClose is provided
        if (onClose) {
          onClose();
        }
      }
    } else {
      toast.error("No redirection set up for this hospital");
    }
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Hospital Details</DialogTitle>
        <DialogDescription>
          Verify emergency room status and other details for {service.name}
        </DialogDescription>
      </DialogHeader>
      
      <div className="grid gap-4 py-4">
        <EmergencyRoomStatusSection 
          hasER={hasER}
          serviceId={service.id}
          onChange={setHasER}
        />
        
        {/* Redirect Hospital Dropdown - Only visible if hasER is false */}
        {hasER === false && (
          <RedirectHospitalSection
            otherHospitals={otherHospitals}
            selectedRedirectId={redirectHospitalId}
            onChange={setRedirectHospitalId}
          />
        )}
        
        <HospitalContactInfo
          address={service.address}
          googleMapsLink={googleMapsLink}
          phone={phone}
          onGoogleMapsLinkChange={setGoogleMapsLink}
          onPhoneChange={setPhone}
        />

        <VerificationDatePicker
          date={verifiedDate}
          onChange={setVerifiedDate}
        />
        
        <HospitalComments
          comments={comments}
          onChange={setComments}
        />
        
        <div className="space-y-2 pt-2">
          <Button 
            onClick={handleSetAsOnlyHospital}
            variant="default"
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Route className="mr-2 h-4 w-4" />
            Set as Only Hospital on Map
          </Button>
          
          {hasER === false && redirectHospitalId && (
            <Button 
              onClick={handleTestRedirection}
              variant="secondary"
              className="w-full"
            >
              <Route className="mr-2 h-4 w-4" />
              Test Redirection
            </Button>
          )}
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
