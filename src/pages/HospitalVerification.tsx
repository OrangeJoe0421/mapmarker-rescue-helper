import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, ArrowLeft, Check, Clock, MapPin, X } from 'lucide-react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { toast } from 'sonner';
import { useToast } from '@/components/ui/use-toast';
import { useMapStore } from '@/store/useMapStore';
import EmergencyRoomVerification from '@/components/EmergencyRoomVerification';
import { EmergencyService } from '@/types/mapTypes';
import { cn } from '@/lib/utils';
import { 
  GOOGLE_MAPS_API_KEY, 
  GOOGLE_MAPS_LIBRARIES, 
  GOOGLE_MAPS_LOADER_ID,
  MAP_OPTIONS 
} from '@/config/mapsConfig';

// Google Maps API key
const GOOGLE_MAPS_API_KEY = "AIzaSyBYXWPdOpB690ph_f9T2ubD9m4fgEqFUl4";

const containerStyle = {
  width: '100%',
  height: '400px'
};

const mapOptions = {
  styles: [
    {
      "elementType": "geometry",
      "stylers": [{ "color": "#242f3e" }]
    },
    {
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#746855" }]
    },
    {
      "elementType": "labels.text.stroke",
      "stylers": [{ "color": "#242f3e" }]
    },
    {
      "featureType": "poi",
      "elementType": "all",
      "stylers": [{ "visibility": "off" }]
    },
    {
      "featureType": "transit",
      "elementType": "all",
      "stylers": [{ "visibility": "off" }]
    },
    {
      "featureType": "road",
      "elementType": "geometry",
      "stylers": [{ "color": "#38414e" }]
    },
    {
      "featureType": "road",
      "elementType": "geometry.stroke",
      "stylers": [{ "color": "#212a37" }]
    },
    {
      "featureType": "road",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#9ca5b3" }]
    },
    {
      "featureType": "water",
      "elementType": "geometry",
      "stylers": [{ "color": "#17263c" }]
    }
  ],
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true
};

interface HospitalWithStatus extends EmergencyService {
  hasEmergencyRoom?: boolean;
  verifiedAt?: Date | null;
  comments?: string;
}

const HospitalVerification = () => {
  const [hospitals, setHospitals] = useState<HospitalWithStatus[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<HospitalWithStatus | null>(null);
  const [selectedInfoWindow, setSelectedInfoWindow] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<boolean | null>(null);
  const [comments, setComments] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);

  const navigate = useNavigate();
  const { toast: shadcnToast } = useToast();
  const { 
    emergencyServices, 
    userLocation, 
    setMapCenter: setMapCenterStore,
  } = useMapStore();

  // Load Google Maps API with centralized config
  const { isLoaded, loadError } = useJsApiLoader({
    id: GOOGLE_MAPS_LOADER_ID,
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES
  });

  useEffect(() => {
    if (emergencyServices) {
      // Filter to only include hospital services
      const hospitalsOnly = emergencyServices.filter(service => 
        service.type.toLowerCase().includes('hospital')
      );
      setHospitals(hospitalsOnly);
    }
  }, [emergencyServices]);

  useEffect(() => {
    if (userLocation) {
      setMapCenter([userLocation.latitude, userLocation.longitude]);
      setMapCenterStore([userLocation.latitude, userLocation.longitude]);
    }
  }, [userLocation, setMapCenterStore]);

  // Calculate the distances if userLocation is present
  useEffect(() => {
    if (userLocation && hospitals.length > 0) {
      // Calculate distance from user location
      const hospitalsWithDistance = hospitals.map((hospital) => {
        const distance = userLocation ? Math.sqrt(
          Math.pow(hospital.latitude - userLocation.latitude, 2) +
          Math.pow(hospital.longitude - userLocation.longitude, 2)
        ) * 111 : undefined;
        
        return {
          ...hospital,
          distance: distance,
        };
      }).sort((a, b) => 
        (a.distance || Infinity) - (b.distance || Infinity)
      );

      setHospitals(hospitalsWithDistance);
    }
  }, [userLocation, hospitals.length]);

  const handleSelectHospital = (hospital: HospitalWithStatus) => {
    setSelectedHospital(hospital);
    setSelectedInfoWindow(true);
    setVerificationStatus(hospital.hasEmergencyRoom ?? null);
    setComments(hospital.comments ?? '');
    setMapCenter([hospital.latitude, hospital.longitude]);
  };

  const handleVerificationToggle = (value: boolean) => {
    setVerificationStatus(value);
  };

  const handleSubmitVerification = async () => {
    if (!selectedHospital) {
      toast.error('No hospital selected');
      return;
    }

    if (verificationStatus === null) {
      toast.error('Please select a verification status');
      return;
    }

    // Optimistically update the UI
    setHospitals(hospitals.map(hospital => {
      if (hospital.id === selectedHospital.id) {
        return {
          ...hospital,
          hasEmergencyRoom: verificationStatus,
          verifiedAt: new Date(),
          comments: comments,
        };
      }
      return hospital;
    }));

    setSelectedHospital({
      ...selectedHospital,
      hasEmergencyRoom: verificationStatus,
      verifiedAt: new Date(),
      comments: comments,
    });

    shadcnToast({
      title: "Verification Submitted",
      description: `You have verified that ${selectedHospital.name} ${verificationStatus ? 'has' : 'does not have'} an emergency room.`,
    });
  };

  const handleCommentsChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComments(event.target.value);
  };

  const getMarkerIcon = (service: EmergencyService) => {
    const type = service.type.toLowerCase();
    if (type.includes('hospital')) return '/hospital-marker.svg';
    if (type.includes('ems') || type.includes('ambulance')) return '/ems-marker.svg';
    if (type.includes('fire')) return '/fire-marker.svg';
    if (type.includes('law') || type.includes('police')) return '/law-marker.svg';
    return '/hospital-marker.svg';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80 p-4">
      <div className="container mx-auto max-w-7xl">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Hospital list */}
          <div className="lg:col-span-1">
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
                          {index === 0 && userLocation && (
                            <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-1" />
                          )}
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
                        {hospital.distance !== undefined && (
                          <div className="text-xs font-medium mt-1 text-[#F97316]">
                            {hospital.distance.toFixed(1)} km from project
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column: Map and verification form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Map card */}
            <Card>
              <CardHeader>
                <CardTitle>Location Map</CardTitle>
              </CardHeader>
              <CardContent className="p-0 rounded-b-lg overflow-hidden">
                {isLoaded ? (
                  <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={mapCenter ? 
                      { lat: mapCenter[0], lng: mapCenter[1] } : 
                      { lat: 37.7749, lng: -122.4194 }
                    }
                    zoom={11}
                    options={MAP_OPTIONS}
                  >
                    {/* Add user location marker (project location) */}
                    {userLocation && (
                      <Marker 
                        position={{ lat: userLocation.latitude, lng: userLocation.longitude }}
                        icon={{
                          url: 'data:image/svg+xml;base64,' + btoa(`
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="8" fill="#38a169" stroke="#ffffff" stroke-width="2" />
                            </svg>
                          `),
                          scaledSize: new window.google.maps.Size(24, 24),
                          anchor: new window.google.maps.Point(12, 12)
                        }}
                      />
                    )}
                    
                    {/* Hospital markers */}
                    {hospitals.map(hospital => (
                      <Marker
                        key={hospital.id}
                        position={{ lat: hospital.latitude, lng: hospital.longitude }}
                        icon={{
                          url: getMarkerIcon(hospital),
                          scaledSize: new window.google.maps.Size(30, 30),
                          anchor: new window.google.maps.Point(15, 15)
                        }}
                        onClick={() => handleSelectHospital(hospital)}
                      />
                    ))}

                    {/* InfoWindow for selected hospital */}
                    {selectedHospital && selectedInfoWindow && (
                      <InfoWindow
                        position={{ lat: selectedHospital.latitude, lng: selectedHospital.longitude }}
                        onCloseClick={() => setSelectedInfoWindow(false)}
                      >
                        <div className="p-2 max-w-xs">
                          <h3 className="font-bold text-black">{selectedHospital.name}</h3>
                          <div className="text-gray-700 text-xs mt-1">{selectedHospital.address}</div>
                          {selectedHospital.verification && (
                            <div className="flex items-center gap-1 text-xs mt-1">
                              {selectedHospital.verification.hasEmergencyRoom ? 
                                <Check className="h-3 w-3 text-green-500" /> : 
                                <X className="h-3 w-3 text-red-500" />}
                              <span>{selectedHospital.verification.hasEmergencyRoom ? "Has Emergency Room" : "No Emergency Room"}</span>
                            </div>
                          )}
                        </div>
                      </InfoWindow>
                    )}
                  </GoogleMap>
                ) : (
                  <div className="h-[400px] flex items-center justify-center bg-muted/50">
                    Loading Map...
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Verification form */}
            {selectedHospital ? (
              <Card>
                <CardHeader>
                  <CardTitle>Verify Emergency Room Status</CardTitle>
                  <CardContent>
                    <p>Selected Hospital: {selectedHospital.name}</p>
                  </CardContent>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant={verificationStatus === true ? "secondary" : "outline"}
                      onClick={() => handleVerificationToggle(true)}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Has Emergency Room
                    </Button>
                    <Button
                      variant={verificationStatus === false ? "secondary" : "outline"}
                      onClick={() => handleVerificationToggle(false)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      No Emergency Room
                    </Button>
                  </div>
                  <div>
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed" htmlFor="comments">
                      Comments
                    </label>
                    <textarea
                      id="comments"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Add any relevant comments"
                      value={comments}
                      onChange={handleCommentsChange}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSubmitVerification}>Submit Verification</Button>
                </CardFooter>
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
