
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ArrowLeft, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { useToast } from '@/components/ui/use-toast';
import { useMapStore } from '@/store/useMapStore';
import EmergencyRoomVerification from '@/components/EmergencyRoomVerification';
import { EmergencyService } from '@/types/mapTypes';
import { cn } from '@/lib/utils';
import { calculateHaversineDistance } from '@/utils/mapUtils';

const HospitalVerification = () => {
  const [hospitals, setHospitals] = useState<EmergencyService[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<EmergencyService | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<boolean | null>(null);
  const [comments, setComments] = useState('');

  const navigate = useNavigate();
  const { toast: shadcnToast } = useToast();
  const { 
    emergencyServices, 
    userLocation,
    selectService
  } = useMapStore();

  // Populate hospitals from all emergency services
  useEffect(() => {
    if (emergencyServices && emergencyServices.length > 0) {
      // Filter to only include hospital services
      const hospitalsOnly = emergencyServices.filter(service => 
        service.type.toLowerCase().includes('hospital')
      );
      
      // Calculate distances for all hospitals if userLocation is available
      if (userLocation) {
        const hospitalsWithDistance = hospitalsOnly.map(hospital => {
          // Calculate direct distance
          const distance = calculateHaversineDistance(
            userLocation.latitude, 
            userLocation.longitude, 
            hospital.latitude, 
            hospital.longitude
          );
          
          return {
            ...hospital,
            distance: hospital.road_distance || distance // Use road_distance if available, otherwise use haversine
          };
        });
        
        // Sort hospitals by distance
        const sortedHospitals = hospitalsWithDistance.sort((a, b) => 
          (a.distance || Infinity) - (b.distance || Infinity)
        );
        
        setHospitals(sortedHospitals);
      } else {
        // No user location, just set the hospitals without distance sorting
        setHospitals(hospitalsOnly);
      }
    } else {
      setHospitals([]);
    }
  }, [emergencyServices, userLocation]);

  const handleSelectHospital = (hospital: EmergencyService) => {
    setSelectedHospital(hospital);
    setVerificationStatus(hospital.verification?.hasEmergencyRoom ?? null);
    setComments(hospital.verification?.comments ?? '');
    selectService(hospital);
  };

  const handleVerificationUpdate = (updated: boolean) => {
    // Refresh the hospitals list
    if (emergencyServices) {
      const updatedHospitals = emergencyServices
        .filter(service => service.type.toLowerCase().includes('hospital'))
        .map(hospital => {
          if (hospital.id === selectedHospital?.id) {
            return {
              ...hospital,
              verification: {
                ...hospital.verification,
                hasEmergencyRoom: verificationStatus || false,
                comments
              }
            };
          }
          return hospital;
        });
      
      // Sort by distance
      const sortedHospitals = userLocation ? updatedHospitals.sort((a, b) => 
        ((a.road_distance || a.distance || Infinity) - (b.road_distance || b.distance || Infinity))
      ) : updatedHospitals;
      
      setHospitals(sortedHospitals);
      toast.success('Hospital verification updated successfully');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80 p-4">
      <div className="container mx-auto max-w-4xl">
        <header className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Hospital Verification</h1>
          </div>
          <p className="text-muted-foreground">
            Verify if hospitals have emergency rooms to improve response planning
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column: Hospital list */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Hospitals</span>
                  <Badge variant="outline" className="ml-2">{hospitals.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[500px] overflow-y-auto">
                  {hospitals.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No hospitals found. Return to the main page and search for a location.
                    </div>
                  ) : (
                    hospitals.map((hospital, index) => (
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
                        </div>
                        <div className="text-sm text-muted-foreground truncate">{hospital.address}</div>
                        {hospital.verification && (
                          <div className="flex items-center gap-1 text-xs mt-1">
                            {hospital.verification.hasEmergencyRoom ? 
                              <Check className="h-3 w-3 text-green-500" /> : 
                              <X className="h-3 w-3 text-red-500" />}
                            <span>{hospital.verification.hasEmergencyRoom ? "Has ER" : "No ER"}</span>
                          </div>
                        )}
                        {(hospital.distance !== undefined || hospital.road_distance !== undefined) && (
                          <div className="text-xs font-medium mt-1 text-[#F97316]">
                            {(hospital.road_distance || hospital.distance)?.toFixed(1)} km from project
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column: Verification form */}
          <div>
            {selectedHospital ? (
              <Card>
                <CardHeader>
                  <CardTitle>Emergency Room Verification</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <h3 className="font-medium">{selectedHospital.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedHospital.address}</p>
                    {(selectedHospital.distance !== undefined || selectedHospital.road_distance !== undefined) && (
                      <p className="text-xs font-medium mt-1 text-[#F97316]">
                        {(selectedHospital.road_distance || selectedHospital.distance)?.toFixed(1)} km from project
                      </p>
                    )}
                  </div>

                  <EmergencyRoomVerification 
                    service={selectedHospital}
                    onVerificationUpdate={handleVerificationUpdate}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-center h-40 text-center text-muted-foreground">
                    <div>
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground/70" />
                      <p>Select a hospital to verify its emergency room status</p>
                    </div>
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
