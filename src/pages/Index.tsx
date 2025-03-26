
import { useEffect, useRef } from 'react';
import { Toaster } from 'sonner';
import MapContainer from '@/components/MapContainer';
import EmergencySidebar from '@/components/EmergencySidebar';
import ExportButton from '@/components/ExportButton';
import { useToast } from '@/components/ui/use-toast';
import { useMapStore } from '@/store/useMapStore';

const Index = () => {
  const { toast } = useToast();
  const { userLocation, emergencyServices, calculateRoutesForAllEMS } = useMapStore();
  const routesCalculatedRef = useRef(false);

  useEffect(() => {
    // Welcome toast
    toast({
      title: "Welcome to Emergency Response Planner",
      description: "Search for a location to find nearby emergency services",
      duration: 5000,
    });
  }, [toast]);

  // Effect to automatically calculate routes when emergency services are loaded
  useEffect(() => {
    if (userLocation && emergencyServices.length > 0 && !routesCalculatedRef.current) {
      // Slight delay to ensure the UI has updated
      const timer = setTimeout(() => {
        calculateRoutesForAllEMS();
        routesCalculatedRef.current = true;
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [userLocation, emergencyServices.length, calculateRoutesForAllEMS]);

  // Reset the calculation flag when the user location changes
  useEffect(() => {
    routesCalculatedRef.current = false;
  }, [userLocation?.latitude, userLocation?.longitude]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80 p-4">
      <div className="container mx-auto max-w-7xl">
        <header className="mb-6 flex justify-between items-center">
          <div className="flex items-center">
            <img 
              src="/stantec-logo-orange.png" 
              alt="Stantec Logo" 
              className="mr-3 h-10 md:h-12"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                console.log("Error loading Stantec logo, falling back to SVG");
                target.src = 'https://www.stantec.com/content/dam/stantec/images/logos/stantec-logo.svg';
              }}
            />
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground animate-fade-in">
                Emergency Response Planner
              </h1>
              <p className="text-muted-foreground mt-1 animate-fade-in" style={{ animationDelay: '100ms' }}>
                Find and map emergency services near any location
              </p>
            </div>
          </div>
          <ExportButton />
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <EmergencySidebar />
          </div>
          <div className="md:col-span-2 animate-fade-in" style={{ animationDelay: '300ms' }}>
            <MapContainer />
          </div>
        </div>
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
};

export default Index;
