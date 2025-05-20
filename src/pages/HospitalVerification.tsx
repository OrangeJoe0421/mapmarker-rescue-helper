import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon, CheckCircle, Home, MapPin, Search, XCircle, ExternalLink, Phone, Navigation } from 'lucide-react';
import { EmergencyService } from '@/types/mapTypes';
import { useMapStore } from '@/store/useMapStore';
import { calculateHaversineDistance } from '@/utils/mapUtils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Define an interface for the database response
interface HospitalData {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  address: string;
  phone: string;
  hours: string;
  state: string;
  has_emergency_room: boolean | null;
  verified_at: string | null;
  created_at: string;
  comments?: string | null;
  google_maps_link?: string | null;
  redirect_hospital_id?: string | null;
}

const HospitalVerification = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [hospitals, setHospitals] = useState<EmergencyService[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<EmergencyService | null>(null);
  const userLocation = useMapStore(state => state.userLocation);
  
  // Verification form state
  const [hasER, setHasER] = useState<boolean | undefined>(undefined);
  const [verifiedDate, setVerifiedDate] = useState<Date | undefined>(new Date());
  const [comments, setComments] = useState<string>('');
  const [googleMapsLink, setGoogleMapsLink] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [redirectHospitalId, setRedirectHospitalId] = useState<string | null>(null);

  useEffect(() => {
    // Load all hospitals on component mount
    loadHospitals();
  }, []);

  const loadHospitals = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('emergency_services')
        .select('*')
        .ilike('type', '%hospital%')
        .order('name');

      if (error) {
        throw error;
      }

      // Map the data to match the EmergencyService type
      let hospitalServices = (data as HospitalData[]).map((item): EmergencyService => ({
        id: item.id,
        name: item.name || '',
        type: item.type || '',
        latitude: item.latitude || 0,
        longitude: item.longitude || 0,
        address: item.address,
        phone: item.phone,
        hours: item.hours,
        state: item.state,
        verification: {
          hasEmergencyRoom: item.has_emergency_room,
          verifiedAt: item.verified_at ? new Date(item.verified_at) : undefined,
          comments: item.comments || undefined
        },
        googleMapsLink: item.google_maps_link || '',
        redirectHospitalId: item.redirect_hospital_id || undefined
      }));

      // Calculate distance from project location if available
      if (userLocation) {
        hospitalServices = hospitalServices.map(hospital => {
          const distance = calculateHaversineDistance(
            userLocation.latitude,
            userLocation.longitude,
            hospital.latitude,
            hospital.longitude
          );
          return {
            ...hospital,
            distance
          };
        });
        
        // Sort by distance
        hospitalServices.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
      }

      setHospitals(hospitalServices);
    } catch (error) {
      console.error('Error loading hospitals:', error);
      toast.error('Failed to load hospitals');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      loadHospitals();
      return;
    }

    const filtered = hospitals.filter(
      hospital => hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 (hospital.address && hospital.address.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    setHospitals(filtered);
  };

  const handleSelectHospital = (hospital: EmergencyService) => {
    setSelectedHospital(hospital);
    setHasER(hospital.verification?.hasEmergencyRoom);
    setVerifiedDate(hospital.verification?.verifiedAt ? new Date(hospital.verification.verifiedAt) : new Date());
    setComments(hospital.verification?.comments || '');
    setGoogleMapsLink(hospital.googleMapsLink || '');
    setPhone(hospital.phone || '');
    setRedirectHospitalId(hospital.redirectHospitalId || null);
  };

  const handleVerify = async () => {
    if (!selectedHospital) return;
    if (hasER === undefined) {
      toast.error("Please select whether this hospital has an emergency room");
      return;
    }

    if (!verifiedDate) {
      toast.error("Please select a verification date");
      return;
    }
    
    setLoading(true);
    try {
      console.log(`Verifying ${selectedHospital.name}, hasER: ${hasER}, date: ${verifiedDate}, comments: ${comments}, googleMapsLink: ${googleMapsLink}, phone: ${phone}, redirectHospitalId: ${redirectHospitalId}`);
      
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
        .eq('id', selectedHospital.id);
      
      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }
      
      console.log('Supabase update response:', data);
      
      // Update local data
      const updatedHospitals = hospitals.map(hospital => {
        if (hospital.id === selectedHospital.id) {
          return {
            ...hospital,
            googleMapsLink: googleMapsLink,
            phone: phone,
            redirectHospitalId: !hasER ? redirectHospitalId : null,
            verification: {
              hasEmergencyRoom: hasER,
              verifiedAt: verifiedDate,
              comments: comments
            }
          };
        }
        return hospital;
      });
      
      setHospitals(updatedHospitals);
      toast.success(`Successfully verified ${selectedHospital.name}`);
      
      // Reset selection
      setSelectedHospital(null);
    } catch (error) {
      console.error('Error verifying hospital:', error);
      toast.error("Failed to update verification status");
    } finally {
      setLoading(false);
    }
  };

  const cancelVerification = () => {
    setSelectedHospital(null);
    setHasER(undefined);
    setVerifiedDate(new Date());
    setComments('');
    setGoogleMapsLink('');
    setPhone('');
    setRedirectHospitalId(null);
  };

  const getERStatusDisplay = (hospital: EmergencyService) => {
    if (hospital.verification?.hasEmergencyRoom === true) {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm font-medium">ER Available</span>
        </div>
      );
    } else if (hospital.verification?.hasEmergencyRoom === false) {
      return (
        <div className="flex items-center gap-1 text-red-600">
          <XCircle className="h-4 w-4" />
          <span className="text-sm font-medium">No ER</span>
        </div>
      );
    } else {
      return <div className="text-sm text-muted-foreground">ER Status: Unknown</div>;
    }
  };

  // Get hospitals that have ERs for redirect options
  const getRedirectOptions = () => {
    if (!selectedHospital) return [];
    
    return hospitals
      .filter(h => 
        // Has an ER and is not the current hospital
        h.id !== selectedHospital.id && 
        h.verification?.hasEmergencyRoom === true
      )
      .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
  };

  const getHospitalRedirectInfo = (hospital: EmergencyService) => {
    if (hospital.redirectHospitalId) {
      const redirectHospital = hospitals.find(h => h.id === hospital.redirectHospitalId);
      if (redirectHospital) {
        return (
          <div className="flex items-center gap-1 text-blue-600">
            <Navigation className="h-4 w-4" />
            <span className="text-sm font-medium">Redirect to: {redirectHospital.name}</span>
          </div>
        );
      }
    }
    return null;
  };

  const filteredHospitals = searchTerm.trim() 
    ? hospitals.filter(h => 
        h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (h.address && h.address.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : hospitals;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80 p-4">
      <div className="container mx-auto max-w-7xl">
        <header className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Hospital ER Verification
            </h1>
            <p className="text-muted-foreground mt-1">
              Verify and update emergency room status for hospitals
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/')}>
            <Home className="h-4 w-4 mr-2" />
            Back to Map
          </Button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Hospitals</CardTitle>
                <CardDescription>
                  {hospitals.length} hospitals in database
                  {userLocation && <span> • Sorted by distance to project</span>}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="Search hospitals..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleSearch} variant="secondary">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>

                <div className="h-[600px] overflow-y-auto border rounded-md">
                  {loading && <div className="p-4 text-center">Loading hospitals...</div>}
                  
                  {!loading && filteredHospitals.length === 0 && (
                    <div className="p-4 text-center text-muted-foreground">
                      No hospitals found.
                    </div>
                  )}

                  {!loading && filteredHospitals.map((hospital, index) => (
                    <div
                      key={hospital.id}
                      className={cn(
                        "p-3 border-b cursor-pointer hover:bg-muted transition-colors",
                        selectedHospital?.id === hospital.id && "bg-muted",
                        index === 0 && userLocation && "border-l-4 border-l-primary"
                      )}
                      onClick={() => handleSelectHospital(hospital)}
                    >
                      <div className={cn(
                        "flex justify-between items-start",
                        index === 0 && userLocation && "font-medium"
                      )}>
                        <div className="font-medium">{hospital.name}</div>
                        {index === 0 && userLocation && (
                          <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">{hospital.address}</div>
                      
                      {hospital.googleMapsLink && (
                        <div className="flex items-center gap-1 text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3" />
                          <a 
                            href={hospital.googleMapsLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline truncate"
                          >
                            Google Link
                          </a>
                        </div>
                      )}
                      
                      {hospital.phone && (
                        <div className="text-sm flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3" /> {hospital.phone}
                        </div>
                      )}
                      {getERStatusDisplay(hospital)}
                      
                      {getHospitalRedirectInfo(hospital)}
                      
                      {hospital.verification?.verifiedAt && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Verified: {format(new Date(hospital.verification.verifiedAt), 'MMM d, yyyy')}
                        </div>
                      )}
                      {hospital.distance !== undefined && (
                        <div className="text-xs font-medium mt-1 text-[#F97316]">
                          {hospital.distance.toFixed(1)} km from project
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {selectedHospital ? (
              <Card>
                <CardHeader>
                  <CardTitle>{selectedHospital.name}</CardTitle>
                  <CardDescription>
                    {selectedHospital.address || 'No address available'}
                  </CardDescription>
                  {selectedHospital.googleMapsLink && (
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <a 
                        href={selectedHospital.googleMapsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline truncate"
                      >
                        Google Link
                      </a>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Emergency Room Status</h4>
                    <RadioGroup 
                      value={hasER === true ? "yes" : hasER === false ? "no" : undefined}
                      onValueChange={(value) => setHasER(value === "yes")}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id={`er-yes-${selectedHospital.id}`} />
                        <label htmlFor={`er-yes-${selectedHospital.id}`} className="text-sm">
                          Has ER
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id={`er-no-${selectedHospital.id}`} />
                        <label htmlFor={`er-no-${selectedHospital.id}`} className="text-sm">
                          No ER
                        </label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  {/* Redirect Hospital Selection - only show if "No ER" is selected */}
                  {hasER === false && (
                    <div className="space-y-1 border-l-2 border-blue-500 pl-3">
                      <label className="text-sm font-medium">Redirect to Hospital with ER</label>
                      <Select
                        value={redirectHospitalId || ''}
                        onValueChange={(value) => setRedirectHospitalId(value || null)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a hospital with ER..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            <em>No redirection</em>
                          </SelectItem>
                          {getRedirectOptions().map((hospital) => (
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
                    <label className="text-sm font-medium">Date Verified</label>
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
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Phone Number</label>
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
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Comments</label>
                    <Textarea 
                      placeholder="Add any additional information about this hospital"
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      className="resize-none"
                      rows={3}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={cancelVerification}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleVerify}
                    disabled={loading || hasER === undefined || !verifiedDate}
                  >
                    {loading ? "Saving..." : "Save Verification"}
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-72">
                  <div className="text-center text-muted-foreground">
                    <h3 className="text-lg font-medium">No Hospital Selected</h3>
                    <p>Select a hospital from the list to verify its emergency room status</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalVerification;
