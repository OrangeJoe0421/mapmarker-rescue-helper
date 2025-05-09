
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import PasswordGate from "./PasswordGate";
import { useToast } from "./ui/use-toast";
import { toast } from "sonner";
import { Database } from "@/types/database";
import { Wand2, AlertCircle } from "lucide-react";
import { EmergencyService, GeoJSONFeatureCollection, GeoJSONFeature } from "@/types/mapTypes";

// Component for displaying file upload form
const FileUploadForm = ({ 
  type, 
  file, 
  onChange, 
  onImport,
  importing,
  color
}: { 
  type: string; 
  file: File | null; 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImport: () => void;
  importing: boolean;
  color: string;
}) => {
  const label = type.charAt(0).toUpperCase() + type.slice(1);
  return (
    <div className="space-y-2 bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
      <label className="text-sm font-medium text-purple-200 flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full bg-${color}-400`}></div>
        {label === "Hospitals" ? label : `${label} Stations`}
      </label>
      <div className="flex flex-col gap-2">
        <input
          type="file"
          accept=".json,.geojson"
          onChange={onChange}
          className="text-sm text-slate-300 bg-slate-700/50 rounded p-1.5 border border-slate-600"
        />
        <Button 
          size="sm"
          disabled={!file || importing}
          onClick={onImport}
          className="w-full bg-purple-500/20 hover:bg-purple-500/40 text-purple-200 border-purple-500/30"
        >
          {importing ? 'Importing...' : 'Import'}
        </Button>
      </div>
    </div>
  );
};

// Convert GeoJSON to emergency service
function convertGeoJSONToService(feature: GeoJSONFeature, serviceType: string): EmergencyService {
  // GeoJSON coordinates are [longitude, latitude]
  const [longitude, latitude] = feature.geometry.coordinates;
  
  const address = [
    feature.properties.ADDRESS,
    feature.properties.CITY,
    feature.properties.STATE,
    feature.properties.ZIPCODE
  ].filter(Boolean).join(', ');
  
  return {
    id: feature.properties.GLOBALID || `${serviceType}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name: feature.properties.NAME || 'Unknown',
    type: serviceType,
    latitude,
    longitude,
    address: address || undefined,
    phone: feature.properties.PHONE,
    hours: feature.properties.HOURS
  };
}

export function DevTools() {
  const [open, setOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [importing, setImporting] = useState(false);
  const [fileUploads, setFileUploads] = useState<{[key: string]: File | null}>({
    hospitals: null,
    fire: null,
    police: null,
    ems: null,
  });
  
  const { toast: uiToast } = useToast();

  const handleFileChange = (type: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileUploads(prev => ({
        ...prev,
        [type]: e.target.files![0]
      }));
    }
  };

  const processGeoJSON = (data: any): GeoJSONFeatureCollection => {
    console.log("Input data type:", typeof data);
    
    // If data is a string (from incomplete JSON), try to parse it
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (err) {
        console.error("Failed to parse JSON string:", err);
        throw new Error("Invalid JSON format");
      }
    }
    
    // Check if data has the correct structure
    if (!data || typeof data !== 'object') {
      throw new Error("Invalid data format: Not an object");
    }
    
    // Handle GeoJSON FeatureCollection
    if (data.type === "FeatureCollection" && Array.isArray(data.features)) {
      return data as GeoJSONFeatureCollection;
    }
    
    throw new Error("Unsupported data format: Expected GeoJSON FeatureCollection");
  };

  const handleImport = async (type: string, file: File) => {
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        if (!e.target?.result) return;
        
        // Process the input data to get a standardized GeoJSON format
        const geoJSON = processGeoJSON(e.target.result);
        const features = geoJSON.features;
        
        console.log(`Parsed ${features.length} records from ${type} GeoJSON file`);
        if (features.length > 0) {
          console.log("Sample feature:", features[0]);
        }
        
        // Convert GeoJSON features to emergency services
        const services: EmergencyService[] = features.map(feature => 
          convertGeoJSONToService(feature, type)
        );
        
        console.log(`Converted ${services.length} ${type} services`, services[0]);
        
        // Process data in chunks to avoid timeout issues
        const chunkSize = 100;
        const chunks = [];
        
        for (let i = 0; i < services.length; i += chunkSize) {
          chunks.push(services.slice(i, i + chunkSize));
        }
        
        let importedCount = 0;
        let errorCount = 0;
        
        for (let chunk of chunks) {
          const { error, count } = await supabase
            .from('emergency_services')
            .upsert(
              chunk.map(item => ({
                id: item.id,
                name: item.name,
                type: item.type,
                latitude: item.latitude,
                longitude: item.longitude,
                address: item.address || null,
                phone: item.phone || null,
                hours: item.hours || null,
              })),
              { onConflict: 'id' }
            );
            
          if (error) {
            console.error('Error importing data:', error);
            errorCount += chunk.length;
          } else {
            importedCount += chunk.length;
          }
        }
        
        if (importedCount > 0) {
          toast.success(`Imported ${importedCount} ${type} services`, {
            description: errorCount > 0 ? `${errorCount} records had errors` : undefined
          });
        } else {
          toast.error(`Failed to import ${type} services`, {
            description: 'No records were successfully imported'
          });
        }
      } catch (err) {
        console.error('Error processing data:', err);
        toast.error(`Failed to import ${type} services`, {
          description: err instanceof Error ? err.message : 'Unknown error'
        });
      } finally {
        setImporting(false);
      }
    };
    
    reader.onerror = () => {
      toast.error(`Failed to read ${type} file`);
      setImporting(false);
    };
    
    reader.readAsText(file);
  };
  
  const handlePasswordSuccess = () => {
    setAuthenticated(true);
    uiToast({ 
      title: "Developer Access Granted",
      description: "You now have access to developer tools"
    });
  };

  return (
    <>
      <Button 
        variant="outline" 
        className="gap-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-200/20 hover:from-purple-500/20 hover:to-blue-500/20"
        onClick={() => setOpen(true)}
      >
        <Wand2 className="h-4 w-4 text-purple-400" />
        <span>Dev Tools</span>
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px] bg-gradient-to-br from-slate-900 to-slate-800 border-purple-500/20">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-purple-400" />
              Developer Tools
            </DialogTitle>
          </DialogHeader>
          
          {!authenticated ? (
            <PasswordGate 
              onCorrectPassword={handlePasswordSuccess} 
              displayFullScreen={false}
              title="Developer Access"
            />
          ) : (
            <Tabs defaultValue="import" className="w-full">
              <TabsList className="grid w-full grid-cols-1 bg-slate-800/50 mb-4">
                <TabsTrigger value="import" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-200">
                  Data Import
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="import" className="space-y-6">
                <div className="p-4 bg-slate-800/50 rounded-md text-sm text-slate-300 border border-slate-700/50 border-l-4 border-l-amber-500">
                  <p className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-400" />
                    <strong>GeoJSON Format Expected</strong>
                  </p>
                  <p className="mt-2 text-slate-400 text-xs">
                    Import files should be in GeoJSON FeatureCollection format with features containing "geometry.coordinates" 
                    for position and "properties" containing NAME, ADDRESS, etc.
                  </p>
                </div>
              
                <div className="grid grid-cols-2 gap-6">
                  <FileUploadForm
                    type="hospitals"
                    file={fileUploads.hospitals}
                    onChange={handleFileChange('hospitals')} 
                    onImport={() => fileUploads.hospitals && handleImport('hospital', fileUploads.hospitals)}
                    importing={importing}
                    color="red"
                  />
                  
                  <FileUploadForm
                    type="fire"
                    file={fileUploads.fire}
                    onChange={handleFileChange('fire')} 
                    onImport={() => fileUploads.fire && handleImport('fire_station', fileUploads.fire)}
                    importing={importing}
                    color="orange"
                  />
                  
                  <FileUploadForm
                    type="police"
                    file={fileUploads.police}
                    onChange={handleFileChange('police')} 
                    onImport={() => fileUploads.police && handleImport('police', fileUploads.police)}
                    importing={importing}
                    color="blue"
                  />
                  
                  <FileUploadForm
                    type="ems"
                    file={fileUploads.ems}
                    onChange={handleFileChange('ems')} 
                    onImport={() => fileUploads.ems && handleImport('doctor', fileUploads.ems)}
                    importing={importing}
                    color="green"
                  />
                </div>
                
                <div className="p-4 bg-slate-800/50 rounded-md text-sm text-slate-300 border border-slate-700/50">
                  <p className="flex items-center gap-2">
                    <Wand2 className="h-4 w-4 text-purple-400" />
                    Import GeoJSON files for emergency services. Files should contain a FeatureCollection of Points.
                  </p>
                  <p className="mt-2 text-slate-400 text-xs">
                    Data will be upserted into the database, updating existing records based on ID.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
