
import { useState, useEffect } from 'react';
import { EmergencyService } from '@/types/mapTypes';
import { fetchEmergencyServices } from '@/utils/emergencyServicesApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Building2, MapPin, Phone, AlertCircle } from 'lucide-react';

const EmergencyServicesList = () => {
  const [services, setServices] = useState<EmergencyService[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadServices = async () => {
      setIsLoading(true);
      try {
        const data = await fetchEmergencyServices();
        setServices(data);
        setError(null);
      } catch (err) {
        console.error("Failed to load services:", err);
        setError("Could not load emergency services");
      } finally {
        setIsLoading(false);
      }
    };

    loadServices();
  }, []);

  const getServiceIcon = (service: EmergencyService) => {
    const type = service.type.toLowerCase();
    if (type.includes('hospital')) return <span className="text-xl">🏥</span>;
    if (type.includes('fire')) return <span className="text-xl">🚒</span>;
    if (type.includes('police') || type.includes('law')) return <span className="text-xl">👮</span>;
    if (type.includes('ems')) return <span className="text-xl">🚑</span>;
    return <span className="text-xl">📍</span>;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          <span>Emergency Services</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mb-2" />
            <p>{error}</p>
          </div>
        ) : services.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <Building2 className="h-8 w-8 mb-2" />
            <p>No emergency services found</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getServiceIcon(service)}</div>
                    <div className="flex-1">
                      <h3 className="font-medium">{service.name}</h3>
                      <Badge variant="outline" className="mt-1">
                        {service.type}
                      </Badge>
                      
                      {service.address && (
                        <div className="flex items-start gap-2 text-sm mt-3">
                          <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                          <span className="text-muted-foreground">{service.address}</span>
                        </div>
                      )}
                      
                      {service.phone && (
                        <div className="flex items-start gap-2 text-sm mt-1">
                          <Phone className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                          <span className="text-muted-foreground">{service.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default EmergencyServicesList;
