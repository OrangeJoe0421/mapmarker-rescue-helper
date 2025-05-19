import { useState } from 'react';
import { useMapStore } from '@/store/useMapStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useEmergencyServicesApi } from '@/hooks/useEmergencyServicesApi';
import { 
  Search, 
  MapPin, 
  Plus, 
  X, 
  PlusCircle, 
  Pencil, 
  Trash2, 
  Crosshair,
  ArrowRight,
  Building2,
  AlertCircle,
  FileText,
  Hash,
  Globe,
  Route,
  Ambulance,
  Phone,
  Clock,
  Navigation,
  CheckCircle,
  Hospital
} from 'lucide-react';
import MarkerMetadataForm from './MarkerMetadataForm';
import LocationMetadataForm from './LocationMetadataForm';
import EmergencyRoomVerification from './EmergencyRoomVerification';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";

const EmergencySidebar = () => {
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("search");
  const [editingMarkerId, setEditingMarkerId] = useState<string | null>(null);
  const [isEditingLocationMetadata, setIsEditingLocationMetadata] = useState<boolean>(false);
  const [selectedRouteMarkerId, setSelectedRouteMarkerId] = useState<string | null>(null);
  const [showAddMarkerForm, setShowAddMarkerForm] = useState(false);
  const [newMarkerLatitude, setNewMarkerLatitude] = useState("");
  const [newMarkerLongitude, setNewMarkerLongitude] = useState("");
  
  // Initialize the emergency services API hook
  const emergencyServicesApi = useEmergencyServicesApi();

  const { 
    userLocation,
    emergencyServices, 
    customMarkers, 
    addingMarker,
    selectedService,
    selectedMarker,
    setUserLocation, 
    setEmergencyServices,
    toggleAddingMarker,
    updateCustomMarker,
    deleteCustomMarker,
    selectService,
    selectMarker,
    calculateRoute,
    calculateRoutesForAllEMS,
    addCustomMarker,
    clearRoutes
  } = useMapStore();

  const markerBeingEdited = editingMarkerId ? 
    customMarkers.find(marker => marker.id === editingMarkerId) : null;

  const hospitals = emergencyServices.filter(service => 
    service.type.toLowerCase().includes('hospital')
  );
  
  // Since we're disabling verification functionality, we'll remove hospital verification logic
  const hospitalsWithER = [];
  const closestHospitalWithER = null;

  const handleSearch = async () => {
    if (!latitude || !longitude) {
      toast.error("Please enter both latitude and longitude");
      return;
    }

    try {
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);

      if (isNaN(lat) || isNaN(lon)) {
        toast.error("Please enter valid numbers for coordinates");
        return;
      }

      if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        toast.error("Coordinates out of range");
        return;
      }

      // Clear routes explicitly BEFORE searching
      clearRoutes();
      
      setIsSearching(true);
      toast.info("Searching for emergency services...");
      
      // Clear previous results first by setting empty array
      setEmergencyServices([]);
      
      // Set the user location
      setUserLocation({ latitude: lat, longitude: lon });
      
      console.log(`Searching with coordinates: ${lat}, ${lon}`);
      
      // Use the hook function which now uses fetchNearestEmergencyServices via the edge function
      const services = await emergencyServicesApi.fetchNearbyEmergencyServices(
        lat, 
        lon, 
        30  // radiusInKm
      );
      
      console.log("Search results:", services);
      
      if (services.length === 0) {
        toast.warning("No emergency services found within 30km");
      }
      
      // Update the services in the store
      setEmergencyServices(services);
      
      // Switch to results tab
      setActiveTab("results");
    } catch (error) {
      console.error("Error during search:", error);
      toast.error("An error occurred during search");
      // Clear any partial results on error
      setEmergencyServices([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Remove the handleRouteToClosestER function since we're disabling verification
  
  const handleRenameMarker = (id: string) => {
    const marker = customMarkers.find(m => m.id === id);
    if (!marker) return;
    
    const newName = prompt("Enter a new name for this marker:", marker.name);
    if (newName && newName.trim() !== "") {
      updateCustomMarker(id, { name: newName });
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      toast.info("Getting your current location...");
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLatitude(latitude.toFixed(6));
          setLongitude(longitude.toFixed(6));
          toast.success("Current location obtained");
        },
        (error) => {
          console.error("Geolocation error:", error);
          toast.error("Unable to get your location");
        }
      );
    } else {
      toast.error("Geolocation is not supported by your browser");
    }
  };

  const handleAddMarkerByCoordinates = () => {
    if (!newMarkerLatitude || !newMarkerLongitude) {
      toast.error("Please enter both latitude and longitude");
      return;
    }

    try {
      const lat = parseFloat(newMarkerLatitude);
      const lon = parseFloat(newMarkerLongitude);

      if (isNaN(lat) || isNaN(lon)) {
        toast.error("Please enter valid numbers for coordinates");
        return;
      }

      if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        toast.error("Coordinates out of range");
        return;
      }

      addCustomMarker({
        name: 'New Marker',
        latitude: lat,
        longitude: lon,
        color: '#3B82F6',
      });

      setNewMarkerLatitude("");
      setNewMarkerLongitude("");
      setShowAddMarkerForm(false);
    } catch (error) {
      toast.error("Invalid coordinates");
    }
  };

  const getServiceColor = (service) => {
    const type = service.type.toLowerCase();
    
    // Remove the verification-specific coloring
    if (type.includes('hospital')) return 'bg-red-600';
    if (type.includes('fire')) return 'bg-orange-600';
    if (type.includes('police') || type.includes('law')) return 'bg-blue-800';
    if (type.includes('ems')) return 'bg-amber-500';
    return 'bg-blue-600';
  };

  const getServiceIcon = (service) => {
    const type = service.type.toLowerCase();
    if (type.includes('hospital')) return <span className="text-xl">🏥</span>;
    if (type.includes('fire')) return <span className="text-xl">🚒</span>;
    if (type.includes('police') || type.includes('law')) return <span className="text-xl">👮</span>;
    if (type.includes('ems')) return <span className="text-xl">🚑</span>;
    return <span className="text-xl">📍</span>;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] w-full gap-4">
      <Tabs defaultValue="search" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="markers">Markers</TabsTrigger>
        </TabsList>
        
        <TabsContent value="search" className="animate-fade-in">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                <span>Search Location</span>
              </CardTitle>
              <CardDescription>
                Enter coordinates to find nearby emergency services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="latitude" className="text-sm font-medium">
                  Latitude
                </label>
                <Input
                  id="latitude"
                  type="text"
                  placeholder="e.g. 34.0522"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="longitude" className="text-sm font-medium">
                  Longitude
                </label>
                <Input
                  id="longitude"
                  type="text"
                  placeholder="e.g. -118.2437"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button 
                className="w-full" 
                onClick={handleSearch}
                disabled={isSearching}
              >
                {isSearching ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Searching...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Find Emergency Services
                  </span>
                )}
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleGetCurrentLocation}
              >
                <Crosshair className="mr-2 h-4 w-4" />
                Use My Current Location
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="glass-card mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <span>Custom Markers</span>
              </CardTitle>
              <CardDescription>
                Add your own markers to the map
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={toggleAddingMarker} 
                variant={addingMarker ? "destructive" : "default"}
                className="w-full"
              >
                {addingMarker ? (
                  <span className="flex items-center gap-2">
                    <X className="h-4 w-4" />
                    Cancel Marker Placement
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <PlusCircle className="h-4 w-4" />
                    Add by Clicking Map
                  </span>
                )}
              </Button>

              <div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowAddMarkerForm(!showAddMarkerForm)}
                >
                  {showAddMarkerForm ? (
                    <span className="flex items-center gap-2">
                      <X className="h-4 w-4" />
                      Hide Coordinate Form
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Input className="h-4 w-4" />
                      Add by Coordinates
                    </span>
                  )}
                </Button>

                {showAddMarkerForm && (
                  <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="marker-latitude" className="text-sm font-medium">
                        Latitude
                      </label>
                      <Input
                        id="marker-latitude"
                        type="text"
                        placeholder="e.g. 34.0522"
                        value={newMarkerLatitude}
                        onChange={(e) => setNewMarkerLatitude(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="marker-longitude" className="text-sm font-medium">
                        Longitude
                      </label>
                      <Input
                        id="marker-longitude"
                        type="text"
                        placeholder="e.g. -118.2437"
                        value={newMarkerLongitude}
                        onChange={(e) => setNewMarkerLongitude(e.target.value)}
                      />
                    </div>
                    <Button 
                      onClick={handleAddMarkerByCoordinates}
                      className="w-full"
                    >
                      Add Marker
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="results" className="animate-fade-in">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                <span>Emergency Services</span>
              </CardTitle>
              <CardDescription>
                {userLocation ? (
                  <span>
                    Services near {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                  </span>
                ) : (
                  <span>No location selected</span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {emergencyServices.length > 0 ? (
                <ScrollArea className="h-[280px] pr-4">
                  <div className="space-y-2">
                    {emergencyServices.map((service) => (
                      <div
                        key={service.id}
                        className={`
                          rounded-lg border p-3 transition-all cursor-pointer
                          ${selectedService?.id === service.id ? 
                            'bg-primary/10 border-primary' : 
                            'hover:bg-secondary/50'
                          }
                        `}
                        onClick={() => selectService(service)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="w-full">
                            <div className="flex items-center gap-2">
                              {getServiceIcon(service)}
                              <h4 className="font-medium">
                                {service.name}
                              </h4>
                            </div>
                            <p className="text-sm text-muted-foreground">{service.type}</p>
                            
                            {service.road_distance && (
                              <div className="text-sm text-muted-foreground mt-1 flex items-center">
                                <span>Distance: {service.road_distance.toFixed(2)} km</span>
                                <ArrowRight className="h-3 w-3 mx-1" />
                                <span>~{Math.ceil(service.road_distance / 0.8)} min drive</span>
                              </div>
                            )}

                            {selectedService?.id === service.id && (
                              <div className="mt-3 pt-3 border-t space-y-2">
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
                                
                                <Button 
                                  onClick={() => calculateRoute(service.id, true)} 
                                  className="w-full gap-2 mt-2"
                                  size="sm"
                                >
                                  <Navigation className="h-4 w-4" />
                                  Route to Location
                                </Button>
                              </div>
                            )}
                          </div>
                          {!selectedService || selectedService.id !== service.id ? (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                selectService(service);
                              }}
                            >
                              <MapPin className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                selectService(null);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : userLocation ? (
                <div className="py-8 text-center text-muted-foreground flex flex-col items-center">
                  <AlertCircle className="h-10 w-10 mb-2 text-muted-foreground/50" />
                  <p>No emergency services found</p>
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground flex flex-col items-center">
                  <Search className="h-10 w-10 mb-2 text-muted-foreground/50" />
                  <p>Search for a location first</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              {userLocation && emergencyServices.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => calculateRoutesForAllEMS()}
                >
                  <Ambulance className="mr-2 h-4 w-4" />
                  Route All EMS to Location
                </Button>
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => setActiveTab("search")}
              >
                Back to Search
              </Button>
              
              {userLocation && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setIsEditingLocationMetadata(true)}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Edit Location Metadata
                </Button>
              )}
            </CardFooter>
          </Card>
          
          {userLocation?.metadata && Object.keys(userLocation.metadata).length > 0 && (
            <Card className="glass-card mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  <span>Location Metadata</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {userLocation.metadata.projectNumber && (
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <span className="font-medium">Project Number:</span> {userLocation.metadata.projectNumber}
                      </span>
                    </div>
                  )}
                  
                  {userLocation.metadata.region && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <span className="font-medium">Region:</span> {userLocation.metadata.region}
                      </span>
                    </div>
                  )}
                  
                  {userLocation.metadata.projectType && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <span className="font-medium">Project Type:</span> {userLocation.metadata.projectType}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setIsEditingLocationMetadata(true)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Metadata
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="markers" className="animate-fade-in">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <span>Custom Markers</span>
              </CardTitle>
              <CardDescription>
                {customMarkers.length} custom {customMarkers.length === 1 ? 'marker' : 'markers'} placed
              </CardDescription>
            </CardHeader>
            <CardContent>
              {customMarkers.length > 0 ? (
                <ScrollArea className="h-[280px] pr-4">
                  <div className="space-y-2">
                    {customMarkers.map((marker) => (
                      <div
                        key={marker.id}
                        className={`
                          rounded-lg border p-3 transition-all
                          ${selectedMarker?.id === marker.id ? 
                            'bg-primary/10 border-primary' : 
                            'hover:bg-secondary/50'
                          }
                        `}
                        onClick={() => selectMarker(marker)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{marker.name}</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {marker.latitude.toFixed(5)}, {marker.longitude.toFixed(5)}
                            </p>
                            
                            {marker.metadata && Object.keys(marker.metadata).length > 0 && (
                              <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                                {marker.metadata.projectNumber && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <Hash className="h-3 w-3" />
                                    <span>{marker.metadata.projectNumber}</span>
                                  </div>
                                )}
                                {marker.metadata.region && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <Globe className="h-3 w-3" />
                                    <span>{marker.metadata.region}</span>
                                  </div>
                                )}
                                {marker.metadata.projectType && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <MapPin className="h-3 w-3" />
                                    <span>{marker.metadata.projectType}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Route buttons for mobile drawer */}
                            <div className="flex mt-2 pt-2 border-t gap-1 md:hidden">
                              <Drawer>
                                <DrawerTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="h-7 text-xs flex-1"
                                  >
                                    <Route className="h-3 w-3 mr-1" />
                                    Route Options
                                  </Button>
                                </DrawerTrigger>
                                <DrawerContent>
                                  <DrawerHeader className="text-left">
                                    <DrawerTitle>Routing Options for {marker.name}</DrawerTitle>
                                  </DrawerHeader>
                                  <div className="p-4 space-y-2">
                                    {userLocation && (
                                      <Button 
                                        size="sm" 
                                        className="w-full"
                                        onClick={() => calculateRoute(marker.id, true)}
                                      >
                                        <Navigation className="h-4 w-4 mr-2" />
                                        Route to Project Location
                                      </Button>
                                    )}
                                    
                                    {hospitals.length > 0 && (
                                      <div className="space-y-1 mt-2">
                                        <p className="text-xs font-medium">Route to nearest hospitals:</p>
                                        <div className="max-h-32 overflow-y-auto space-y-1">
                                          {hospitals.slice(0, 5).map(hospital => (
                                            <Button
                                              key={hospital.id}
                                              size="sm"
                                              variant="outline"
                                              className="w-full text-xs"
                                              onClick={() => calculateRoute(marker.id, false, hospital.id)}
                                            >
                                              <Hospital className="h-3 w-3 mr-1" />
                                              {hospital.name}
                                            </Button>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <DrawerFooter>
                                    <Button variant="outline" size="sm">Close</Button>
                                  </DrawerFooter>
                                </DrawerContent>
                              </Drawer>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {/* Desktop routing button */}
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-7 w-7 p-0 hidden md:flex"
                              title="Routing options"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRouteMarkerId(marker.id);
                              }}
                            >
                              <Route className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingMarkerId(marker.id);
                              }}
                            >
                              <FileText className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRenameMarker(marker.id);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Delete marker "${marker.name}"?`)) {
                                  deleteCustomMarker(marker.id);
                                }
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="py-8 text-center text-muted-foreground flex flex-col items-center">
                  <Plus className="h-10 w-10 mb-2 text-muted-foreground/50" />
                  <p>No custom markers added yet</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={toggleAddingMarker}
                  >
                    Add Your First Marker
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAddingMarker}
                disabled={addingMarker}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Marker
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Dialog open={!!editingMarkerId} onOpenChange={(open) => !open && setEditingMarkerId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>Edit Marker Metadata</DialogTitle>
          {markerBeingEdited && (
            <MarkerMetadataForm 
              marker={markerBeingEdited} 
              onClose={() => setEditingMarkerId(null)} 
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditingLocationMetadata} onOpenChange={setIsEditingLocationMetadata}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>Edit Location Metadata</DialogTitle>
          <LocationMetadataForm onClose={() => setIsEditingLocationMetadata(false)} />
        </DialogContent>
      </Dialog>
      
      {/* Routing Dialog for Desktop */}
      <Dialog open={!!selectedRouteMarkerId} onOpenChange={(open) => !open && setSelectedRouteMarkerId(null)}>
        <DialogContent className="sm:max-w-xs">
          <DialogTitle>Routing Options</DialogTitle>
          <div className="space-y-3 py-2">
            {userLocation && (
              <Button 
                size="sm" 
                className="w-full"
                onClick={() => {
                  if (selectedRouteMarkerId) {
                    calculateRoute(selectedRouteMarkerId, true);
                    setSelectedRouteMarkerId(null);
                  }
                }}
              >
                <Navigation className="h-4 w-4 mr-2" />
                Route to Project Location
              </Button>
            )}
            
            {hospitals.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium">Route to nearest hospitals:</p>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {hospitals.slice(0, 5).map(hospital => (
                    <Button
                      key={hospital.id}
                      size="sm"
                      variant="outline"
                      className="w-full text-xs h-8"
                      onClick={() => {
                        if (selectedRouteMarkerId) {
                          calculateRoute(selectedRouteMarkerId, false, hospital.id);
                          setSelectedRouteMarkerId(null);
                        }
                      }}
                    >
                      <Hospital className="h-3 w-3 mr-1" />
                      {hospital.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmergencySidebar;
