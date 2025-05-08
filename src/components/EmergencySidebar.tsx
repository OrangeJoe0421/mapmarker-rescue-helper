
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Map, Navigation, MapPin, Plus, Edit, Trash2 } from 'lucide-react';
import { useMapStore } from '@/store/useMapStore';
import ServiceDetailsCard from './ServiceDetailsCard';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { CustomMarker } from '@/types/mapTypes';
import { Badge } from './ui/badge';
import MarkerMetadataForm from './MarkerMetadataForm';

const EmergencySidebar = () => {
  const { 
    emergencyServices, 
    selectService, 
    selectedService,
    userLocation,
    setUserLocation,
    calculateRoute,
    customMarkers,
    toggleAddingMarker,
    addingMarker,
    deleteCustomMarker,
    selectMarker,
    selectedMarker
  } = useMapStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showMetadataForm, setShowMetadataForm] = useState(false);

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

  const handleAddMarkerToggle = () => {
    toggleAddingMarker();
  };

  const handleEditMarker = (marker: CustomMarker) => {
    selectMarker(marker);
    setShowMetadataForm(true);
  };

  const handleDeleteMarker = (markerId: string) => {
    deleteCustomMarker(markerId);
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
              <TabsTrigger value="markers">
                <MapPin className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Markers</span>
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
            
            <TabsContent value="markers" className="h-[480px] overflow-auto pt-2">
              <div className="space-y-3">
                <Button 
                  onClick={handleAddMarkerToggle} 
                  className={`w-full ${addingMarker ? 'bg-amber-600 hover:bg-amber-700' : ''}`}
                >
                  {addingMarker ? (
                    <>
                      <MapPin className="h-4 w-4 mr-2" />
                      Cancel Placing Marker
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Custom Marker
                    </>
                  )}
                </Button>
                
                {addingMarker && (
                  <div className="text-sm text-amber-500 animate-pulse">
                    Click on the map to place your marker
                  </div>
                )}
                
                <div className="text-sm font-medium mb-2">Custom Markers</div>
                
                {customMarkers.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">
                    No custom markers yet.<br/>
                    Click "Add Custom Marker" to create one.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customMarkers.map((marker) => (
                      <div 
                        key={marker.id} 
                        className="p-2 border rounded-md bg-secondary flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{marker.name}</div>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => handleEditMarker(marker)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteMarker(marker.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="text-xs">
                          {marker.latitude.toFixed(5)}, {marker.longitude.toFixed(5)}
                        </div>
                        
                        {marker.metadata && (
                          <div className="flex flex-wrap gap-1">
                            {marker.metadata.projectNumber && (
                              <Badge variant="outline" className="text-xs">
                                #{marker.metadata.projectNumber}
                              </Badge>
                            )}
                            {marker.metadata.region && (
                              <Badge variant="outline" className="text-xs">
                                {marker.metadata.region}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
      
      {selectedMarker && showMetadataForm && (
        <MarkerMetadataForm 
          marker={selectedMarker} 
          onClose={() => {
            selectMarker(null);
            setShowMetadataForm(false);
          }}
        />
      )}
    </Card>
  );
};

export default EmergencySidebar;
