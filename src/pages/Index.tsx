
import { useEffect } from 'react';
import { Toaster } from 'sonner';
import MapContainer from '@/components/MapContainer';
import EmergencySidebar from '@/components/EmergencySidebar';
import ExportButton from '@/components/ExportButton';
import { useToast } from '@/components/ui/use-toast';

const Index = () => {
  const { toast } = useToast();

  useEffect(() => {
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
            <MapContainer />
          </div>
        </div>
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
};

export default Index;
