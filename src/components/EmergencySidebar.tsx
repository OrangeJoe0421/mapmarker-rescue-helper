import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Map, Plus, Navigation } from 'lucide-react';
import { useMapStore } from '@/store/useMapStore';
import ServiceDetailsCard from './ServiceDetailsCard';
import DataImporter from './DataImporter';
import { Input } from './ui/input';
import { Button } from './ui/button';

const EmergencySidebar = () => {
  const { 
    emergencyServices, 
    selectService, 
    selectedService,
    userLocation,
    setUserLocation,
    calculateRoute,
  } = useMapStore();
  const [searchQuery, setSearchQuery] = useState('');

  const handleLocationSearch = () => {
    if (searchQuery.trim() === '') return;

    // Geocoding logic here (replace with your actual geocoding implementation)
    // For demonstration purposes, let's assume a successful geocode returns:
    const geocodedLocation = {
      latitude: 34.0522,  // Example latitude for Los Angeles
      longitude: -118.2437, // Example longitude for Los Angeles
      metadata: {
        projectNumber: "12345",
        region: "SoCal",
        projectType: "Development"
      }
    };

    if (geocodedLocation) {
      setUserLocation(geocodedLocation);
    } else {
      alert('Location not found. Please try a different search.');
    }
  };

  const handleServiceClick = (serviceId: string) => {
    const service = emergencyServices.find(s => s.id === serviceId);
    if (service) {
      selectService(service);
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="py-4">
        <CardTitle className="text-lg flex justify-between items-center">
          Emergency Services
          <Tabs defaultValue="search" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="search">
                <Search className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Search</span>
              </TabsTrigger>
              <TabsTrigger value="results">
                <Map className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Results</span>
              </TabsTrigger>
              <TabsTrigger value="import">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Import</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="pt-2">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Search location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button onClick={handleLocationSearch} className="w-full">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
                {userLocation && (
                  <div className="text-sm text-muted-foreground">
                    Current Location: {userLocation.latitude}, {userLocation.longitude}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="results" className="h-[480px] overflow-auto pt-2">
              {emergencyServices.length === 0 ? (
                <div className="text-center text-muted-foreground">
                  No emergency services found.
                </div>
              ) : (
                <div className="space-y-2">
                  {emergencyServices.map((service) => (
                    <Button
                      key={service.id}
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => handleServiceClick(service.id)}
                    >
                      <div className="flex items-center gap-2">
                        {service.name}
                        {service.road_distance !== undefined && (
                          <span className="ml-auto text-xs text-muted-foreground">
                            {service.road_distance.toFixed(2)} km
                          </span>
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="import" className="h-[480px] overflow-auto pt-2">
              <DataImporter />
            </TabsContent>
          </Tabs>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto py-0">
        {userLocation ? (
          <div className="text-sm text-muted-foreground">
            Click on a result to view details.
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            Search for a location to find nearby emergency services.
          </div>
        )}
      </CardContent>
      {selectedService && (
        <ServiceDetailsCard service={selectedService} onClose={() => selectService(null)} />
      )}
    </Card>
  );
};

export default EmergencySidebar;
