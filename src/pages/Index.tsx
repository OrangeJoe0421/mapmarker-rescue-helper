import { useEffect, useRef, useState } from 'react';
import { Toaster } from 'sonner';
import { toast } from 'sonner';
import MapContainer from '@/components/MapContainer';
import EmergencySidebar from '@/components/EmergencySidebar';
import ExportButton from '@/components/ExportButton';
import { ClearButton } from '@/components/ui/clear-button';
import { useToast } from '@/components/ui/use-toast';
import { useMapStore } from '@/store/useMapStore';
import PasswordGate from '@/components/PasswordGate';
import { DevTools } from '@/components/DevTools';
import { checkDatabaseConnection } from '@/utils/supabaseHelpers';
import RouteDetailsDialog from '@/components/RouteDetailsDialog';

const Index = () => {
  const { toast: shadcnToast } = useToast();
  const { userLocation, emergencyServices, calculateRoutesForAllEMS } = useMapStore();
  const routesCalculatedRef = useRef(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("auth") === "true";
  });
  const [dbConnectionStatus, setDbConnectionStatus] = useState<string>("Checking...");
  const [retryCount, setRetryCount] = useState(0);

  // Check database connection on startup with retry mechanism
  useEffect(() => {
    if (!isAuthenticated) return;

    async function checkDbConnection() {
      try {
        setDbConnectionStatus("Connecting...");
        console.log("Checking database connection...");

        // Instead of direct Supabase calls, use our helper which now uses the Edge Function
        const result = await checkDatabaseConnection();
        
        if (!result.success) {
          throw new Error(result.message);
        }

        const recordCount = result.count;
        setDbConnectionStatus(`Connected: ${recordCount} records available`);
        console.log("Database connection successful, found records:", recordCount);
        setRetryCount(0); // Reset retry counter on success
      } catch (err) {
        console.error("Database check failed:", err);
        
        if (retryCount < 3) {
          // Retry with exponential backoff
          const retryDelay = Math.pow(2, retryCount) * 1000;
          setDbConnectionStatus(`Connection failed. Retrying in ${retryDelay/1000}s...`);
          
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, retryDelay);
        } else {
          // After 3 retries, show error
          setDbConnectionStatus("Database connection failed");
          toast.error("Unable to connect to the emergency services database");
          shadcnToast({
            title: "Database Connection Error",
            description: "Unable to connect to the emergency services database after multiple attempts",
            variant: "destructive",
          });
        }
      }
    }
    
    checkDbConnection();
  }, [isAuthenticated, retryCount, shadcnToast]);

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

  if (!isAuthenticated) {
    return <PasswordGate onCorrectPassword={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80 p-4">
      <div className="container mx-auto max-w-7xl">
        <header className="mb-6 flex justify-between items-center">
          <div className="flex items-center">
            <img 
              src="/lovable-uploads/e7fb8cc8-9b48-457c-a65f-7ed272d81060.png" 
              alt="Stantec Logo" 
              className="mr-3 h-10 md:h-12"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
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
              {dbConnectionStatus && (
                <p className="text-xs text-muted-foreground mt-1">
                  Database: {dbConnectionStatus}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <DevTools />
            <ClearButton />
            <ExportButton />
          </div>
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
