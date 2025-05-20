import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, Clock, MapPin, Navigation, X, Info, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { useMapStore } from '@/store/useMapStore';
import { EmergencyService } from '@/types/mapTypes';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import HospitalDetailsDialog from './HospitalDetailsDialog';
import { Link } from 'react-router-dom';

interface ServiceDetailsCardProps {
  service: EmergencyService | null;
  onClose: () => void;
}

const ServiceDetailsCard: React.FC<ServiceDetailsCardProps> = ({ service, onClose }) => {
  const { calculateRoute, emergencyServices } = useMapStore();

  if (!service) return null;

  const handleRouteClick = () => {
    calculateRoute(service.id, true);
  };
  
  const handleTestRedirection = () => {
    if (service.verification?.hasEmergencyRoom === false && service.redirectHospitalId) {
      calculateRoute(service.id, true);
    }
  };

  const getServiceColor = () => {
    const type = service.type.toLowerCase();
    if (type.includes('hospital')) return 'bg-red-600';
    if (type.includes('fire')) return 'bg-orange-600';
    if (type.includes('police') || type.includes('law')) return 'bg-blue-800';
    if (type.includes('ems')) return 'bg-amber-500';
    return 'bg-blue-600';
  };

  const getServiceIcon = () => {
    const type = service.type.toLowerCase();
    if (type.includes('hospital')) return <span className="text-xl">🏥</span>;
    if (type.includes('fire')) return <span className="text-xl">🚒</span>;
    if (type.includes('police') || type.includes('law')) return <span className="text-xl">👮</span>;
    if (type.includes('ems')) return <span className="text-xl">🚑</span>;
    return <span className="text-xl">📍</span>;
  };

  // Check if it's a hospital
  const isHospital = service.type.toLowerCase().includes('hospital');

  // Get redirect hospital if applicable
  const redirectHospital = service.redirectHospitalId ? 
    emergencyServices.find(h => h.id === service.redirectHospitalId) : 
    undefined;

  // Display ER Status for hospitals
  const renderERStatus = () => {
    if (!isHospital) return null;
    
    if (service.verification?.hasEmergencyRoom === true) {
      return (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>ER Available</span>
        </div>
      );
    } else if (service.verification?.hasEmergencyRoom === false) {
      return (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <XCircle className="h-4 w-4 shrink-0" />
          <span>No ER</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>ER Status: Unknown</span>
        </div>
      );
    }
  };

  return (
    <Card className="absolute bottom-4 right-4 w-80 shadow-lg z-[1000] animate-in slide-in-from-bottom-5 duration-300">
      <div className={`${getServiceColor()} h-2 rounded-t-lg w-full`} />
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            {getServiceIcon()}
            <CardTitle className="text-lg">{service.name}</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>{service.type}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-3 pt-0">
        {service.address && (
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
            <span>{service.address}</span>
          </div>
        )}
        
        {service.phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span>{service.phone}</span>
          </div>
        )}
        
        {service.hours && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span>{service.hours}</span>
          </div>
        )}
        
        {service.road_distance !== undefined && (
          <div className="flex items-center gap-2 text-sm font-medium">
            <Navigation className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span>{service.road_distance.toFixed(2)} km from project</span>
          </div>
        )}

        {/* Display emergency room status for hospitals */}
        {renderERStatus()}

        {/* Show redirect hospital information if applicable */}
        {service.verification?.hasEmergencyRoom === false && redirectHospital && (
          <div className="flex items-center gap-2 text-sm bg-amber-50 p-2 rounded-md border border-amber-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
            <span className="text-amber-700">
              <span className="font-medium">Redirects to:</span> {redirectHospital.name}
            </span>
          </div>
        )}

        {isHospital && service.verification?.verifiedAt && (
          <div className="text-xs text-muted-foreground">
            Last verified: {new Date(service.verification.verifiedAt).toLocaleDateString()}
          </div>
        )}
        
        {service.googleMapsLink && (
          <div className="flex items-center mt-2">
            <Button 
              variant="outline"
              size="sm"
              className="w-full gap-2 text-xs"
              onClick={() => window.open(service.googleMapsLink!, '_blank')}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View on Google Maps
            </Button>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-0 flex flex-col space-y-2">
        <Button 
          onClick={handleRouteClick} 
          className="w-full gap-2"
          size="sm"
        >
          <Navigation className="h-4 w-4" />
          Route to Project
        </Button>
        
        {service.verification?.hasEmergencyRoom === false && redirectHospital && (
          <Button 
            onClick={handleTestRedirection}
            variant="outline"
            className="w-full gap-2 border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
            size="sm"
          >
            <Route className="h-4 w-4" />
            Test Redirection to {redirectHospital.name}
          </Button>
        )}
        
        {isHospital && (
          <>
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  size="sm"
                >
                  <Info className="h-4 w-4" />
                  Hospital Details
                </Button>
              </DialogTrigger>
              <HospitalDetailsDialog service={service} />
            </Dialog>
            
            <Link to="/hospital-verification" className="w-full">
              <Button 
                variant="secondary"
                className="w-full gap-2"
                size="sm"
              >
                <CheckCircle className="h-4 w-4" />
                Update Verification
              </Button>
            </Link>
          </>
        )}
      </CardFooter>
    </Card>
  );
};

export default ServiceDetailsCard;
