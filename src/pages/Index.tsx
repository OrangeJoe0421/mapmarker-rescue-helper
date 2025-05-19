
import { useEffect, useRef, useState } from 'react';
import { Toaster } from 'sonner';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import MapContainer from '@/components/MapContainer';
import EmergencySidebar from '@/components/EmergencySidebar';
import ExportButton from '@/components/ExportButton';
import { ClearButton } from '@/components/ui/clear-button';
import { useToast } from '@/components/ui/use-toast';
import { useMapStore } from '@/store/useMapStore';
import PasswordGate from '@/components/PasswordGate';
import { DevTools } from '@/components/DevTools';
import { Button } from '@/components/ui/button';
import { Hospital } from 'lucide-react';
import { checkDatabaseConnection } from '@/utils/supabaseHelpers';

const Index = () => {
  const { toast: shadcnToast } = useToast();
  const { userLocation, emergencyServices, calculateRoutesForAllEMS, setMapCenter } = useMapStore();
  const routesCalculatedRef = useRef(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("auth") === "true";
  });
  const [dbConnectionStatus, setDbConnectionStatus] = useState<string>("Checking...");
  const [retryCount, setRetryCount] = useState(0);
  const [isInitialRender, setIsInitialRender] = useState(true);
  const initialCheckCompleteRef = useRef(false);
  const userLocationInitializedRef = useRef(false);

  // Prevent animation flickering on re-renders by tracking initial render
  useEffect(() => {
    // Use RAF to ensure we're past the first render cycle
    const animationId = requestAnimationFrame(() => {
      setIsInitialRender(false);
    });
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Check database connection on startup with retry mechanism
  useEffect(() => {
    if (!isAuthenticated || initialCheckCompleteRef.current) return;

    async function checkDbConnection() {
      try {
        setDbConnectionStatus("Connecting...");
        console.log("Checking database connection...");

        // Now using direct Supabase client connection
        const result = await checkDatabaseConnection();
        
        if (!result.success) {
          throw new Error(result.message);
        }

        const recordCount = result.count;
        setDbConnectionStatus(`Connected: ${recordCount} records available`);
        console.log("Database connection successful, found records:", recordCount);
        setRetryCount(0); // Reset retry counter on success
        initialCheckCompleteRef.current = true;
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
          initialCheckCompleteRef.current = true;
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

    // Ensure the map is centered on user location when it changes
    if (userLocation && !userLocationInitializedRef.current) {
      console.log("Centering map on user location:", [userLocation.latitude, userLocation.longitude]);
      setMapCenter([userLocation.latitude, userLocation.longitude]);
      userLocationInitializedRef.current = true;
    }
  }, [userLocation?.latitude, userLocation?.longitude, setMapCenter]);

  // Debug log for userLocation
  useEffect(() => {
    console.log("User location in Index:", userLocation);
  }, [userLocation]);

  if (!isAuthenticated) {
    return <PasswordGate onCorrectPassword={() => setIsAuthenticated(true)} />;
  }

  // Only apply animation classes on initial render, not on re-renders
  const headerAnimationClass = isInitialRender ? "animate-fade-in" : "";
  const subtitleAnimationClass = isInitialRender ? "animate-fade-in" : "";
  const sidebarAnimationClass = isInitialRender ? "animate-fade-in" : "";
  const mapAnimationClass = isInitialRender ? "animate-fade-in" : "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80 p-4">
      <div className="container mx-auto max-w-7xl">
        <header className="mb-6 flex justify-between items-center">
          <div>
            <h1 className={`text-3xl font-bold tracking-tight text-foreground ${headerAnimationClass}`}>
              Emergency Response Planner
            </h1>
            <p className={`text-muted-foreground mt-1 ${subtitleAnimationClass}`} style={isInitialRender ? { animationDelay: '100ms' } : {}}>
              Find and map emergency services near any location
            </p>
            {dbConnectionStatus && (
              <p className="text-xs text-muted-foreground mt-1">
                Database: {dbConnectionStatus}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Link to="/hospital-verification">
              <Button variant="outline" className="gap-2">
                <Hospital className="h-4 w-4" />
                Verify Hospitals
              </Button>
            </Link>
            <DevTools />
            <ClearButton />
            <ExportButton />
          </div>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`md:col-span-1 ${sidebarAnimationClass}`} style={isInitialRender ? { animationDelay: '200ms' } : {}}>
            <EmergencySidebar />
          </div>
          <div className={`md:col-span-2 ${mapAnimationClass}`} style={isInitialRender ? { animationDelay: '300ms' } : {}}>
            <MapContainer />
          </div>
        </div>
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
};

export default Index;
