
import { useEffect } from 'react';
import { Toaster } from 'sonner';
import LeafletMapMarkers from '@/components/LeafletMapMarkers';
import EmergencySidebar from '@/components/EmergencySidebar';
import ExportButton from '@/components/ExportButton';
import { useToast } from '@/components/ui/use-toast';

// CSS fix for Leaflet marker icons
const fixLeafletMarker = () => {
  // Get the image path based on the code's environment
  const getImagePath = (iconName: string) => {
    const baseUrl = import.meta.env.BASE_URL || '/';
    return `${baseUrl}marker-icon-${iconName}.png`;
  };

  // Fix the default Leaflet icon path issue
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);
};

const Index = () => {
  const { toast } = useToast();

  useEffect(() => {
    fixLeafletMarker();
    
    // Welcome toast
    toast({
      title: "Welcome to Emergency Response Planner",
      description: "Search for a location to find nearby emergency services",
      duration: 5000,
    });
  }, [toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="container mx-auto max-w-7xl">
        <header className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground animate-fade-in">
              Emergency Response Planner
            </h1>
            <p className="text-muted-foreground mt-1 animate-fade-in" style={{ animationDelay: '100ms' }}>
              Find and map emergency services near any location
            </p>
          </div>
          <ExportButton />
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <EmergencySidebar />
          </div>
          <div className="md:col-span-2 animate-fade-in" style={{ animationDelay: '300ms' }}>
            <LeafletMapMarkers />
          </div>
        </div>
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
};

export default Index;
