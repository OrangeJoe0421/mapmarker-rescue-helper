import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import PasswordGate from "./PasswordGate";
import { useToast } from "./ui/use-toast";
import { toast } from "sonner";
import { Database } from "@/types/database";
import { Wand2, AlertCircle, Bug, FileSpreadsheet } from "lucide-react";
import { EmergencyService } from "@/types/mapTypes";
import { useEmergencyServicesApi } from "@/hooks/useEmergencyServicesApi";

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
          accept=".csv"
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

// Parse CSV data function
function parseCSV(csvText: string): EmergencyService[] {
  try {
    // Split by lines and remove any empty lines
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    
    // The first line should be the header
    const header = lines[0].split(',').map(h => h.trim());
    
    // Expected headers (case insensitive)
    const expectedHeaders = ['id', 'name', 'type', 'latitude', 'longitude', 'address', 'state', 'phone', 'hours'];
    
    // Map the actual header positions to our expected headers
    const headerMap: Record<string, number> = {};
    
    // Check that all expected headers exist
    for (const expected of expectedHeaders) {
      const index = header.findIndex(h => h.toLowerCase() === expected.toLowerCase());
      if (index !== -1) {
        headerMap[expected] = index;
      } else if (['id', 'name', 'type', 'latitude', 'longitude'].includes(expected)) {
        // These fields are required
        throw new Error(`Required column '${expected}' not found in the CSV header`);
      }
      // Other fields are optional
    }
    
    // Parse each data line
    const services: EmergencyService[] = [];
    for (let i = 1; i < lines.length; i++) {
      // Skip empty lines
      if (!lines[i].trim()) continue;
      
      // Split the line by comma but handle quoted values correctly
      const values: string[] = [];
      let currentValue = '';
      let inQuotes = false;
      
      for (let j = 0; j < lines[i].length; j++) {
        const char = lines[i][j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(currentValue.trim());
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim()); // Add the last value
      
      // Create the service object
      const lat = parseFloat(values[headerMap['latitude']]);
      const lng = parseFloat(values[headerMap['longitude']]);
      
      // Skip records with invalid coordinates
      if (isNaN(lat) || isNaN(lng)) {
        console.warn(`Skipping record ${i} due to invalid coordinates:`, values);
        continue;
      }
      
      const service: EmergencyService = {
        id: values[headerMap['id']] || `${values[headerMap['type']]}-${Date.now()}-${Math.random().toString(36).substring(2)}`,
        name: values[headerMap['name']],
        type: values[headerMap['type']],
        latitude: lat,
        longitude: lng
      };
      
      // Add optional fields if they exist in the CSV
      if (headerMap['address'] !== undefined) {
        const address = values[headerMap['address']];
        if (address) service.address = address;
      }
      
      if (headerMap['state'] !== undefined) {
        const state = values[headerMap['state']];
        if (state) service.address = (service.address || '') + ', ' + state;
      }
      
      if (headerMap['phone'] !== undefined) {
        const phone = values[headerMap['phone']];
        if (phone) service.phone = phone;
      }
      
      if (headerMap['hours'] !== undefined) {
        const hours = values[headerMap['hours']];
        if (hours) service.hours = hours;
      }
      
      services.push(service);
    }
    
    return services;
  } catch (err) {
    console.error('Error parsing CSV:', err);
    throw err;
  }
}

export function DevTools() {
  const [open, setOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importDebug, setImportDebug] = useState<any | null>(null);
  const [fileUploads, setFileUploads] = useState<{[key: string]: File | null}>({
    hospitals: null,
    fire: null,
    police: null,
    ems: null,
  });
  
  // Import the API hook at the component level
  const { batchImportServices } = useEmergencyServicesApi();
  const { toast: uiToast } = useToast();

  const handleFileChange = (type: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileUploads(prev => ({
        ...prev,
        [type]: e.target.files![0]
      }));
      // Clear previous errors when a new file is selected
      setImportError(null);
      setImportDebug(null);
    }
  };

  const handleImport = async (type: string, file: File) => {
    if (!file) return;

    setImporting(true);
    setImportError(null);
    setImportDebug(null);
    
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        if (!e.target?.result) {
          setImportError("Failed to read file contents");
          setImporting(false);
          return;
        }
        
        // Parse the CSV data
        const csvText = e.target.result.toString();
        const services = parseCSV(csvText);
        
        console.log(`Parsed ${services.length} records from ${type} CSV file`);
        if (services.length === 0) {
          setImportError(`No valid records found in the CSV file`);
          setImporting(false);
          return;
        }
        
        if (services.length > 0) {
          console.log("Sample service:", services[0]);
          setImportDebug({
            sampleService: services[0]
          });
        }
        
        // Use the batch import function imported at the component level
        const result = await batchImportServices(services);
        
        if (result.success) {
          toast.success(`Imported ${result.imported} ${type} services`, {
            description: result.errors > 0 ? `${result.errors} records had errors` : undefined
          });
        } else {
          const errorMessage = `Failed to import ${type} services`;
          setImportError(errorMessage);
          toast.error(errorMessage, {
            description: `No records were successfully imported. ${result.errors} records failed.`
          });
        }
      } catch (err) {
        console.error('Error processing data:', err);
        const errorMessage = `Failed to import ${type} services: ${err instanceof Error ? err.message : 'Unknown error'}`;
        setImportError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setImporting(false);
      }
    };
    
    reader.onerror = () => {
      const errorMessage = `Failed to read ${type} file`;
      setImportError(errorMessage);
      toast.error(errorMessage);
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
                    <FileSpreadsheet className="h-4 w-4 text-amber-400" />
                    <strong>CSV Format Expected</strong>
                  </p>
                  <p className="mt-2 text-slate-400 text-xs">
                    Import files should be in CSV format with headers: id, name, type, latitude, longitude, address, state, phone, hours. 
                    Required fields are: id, name, type, latitude, longitude.
                  </p>
                </div>
              
                {importError && (
                  <div className="p-4 bg-slate-800/50 rounded-md text-sm text-red-300 border border-slate-700/50 border-l-4 border-l-red-500">
                    <p className="flex items-center gap-2">
                      <Bug className="h-4 w-4 text-red-400" />
                      <strong>Import Error</strong>
                    </p>
                    <p className="mt-2 text-red-200/70 text-xs whitespace-pre-wrap">
                      {importError}
                    </p>
                    
                    {importDebug && (
                      <div className="mt-3 p-2 bg-slate-900/50 rounded text-xs font-mono text-slate-300 overflow-auto max-h-32">
                        <div className="font-semibold text-purple-300">Debug Info:</div>
                        <pre className="text-xs">{JSON.stringify(importDebug, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-6">
                  <FileUploadForm
                    type="hospitals"
                    file={fileUploads.hospitals}
                    onChange={handleFileChange('hospitals')} 
                    onImport={() => fileUploads.hospitals && handleImport('hospitals', fileUploads.hospitals)}
                    importing={importing}
                    color="red"
                  />
                  
                  <FileUploadForm
                    type="fire"
                    file={fileUploads.fire}
                    onChange={handleFileChange('fire')} 
                    onImport={() => fileUploads.fire && handleImport('fire', fileUploads.fire)}
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
                    onImport={() => fileUploads.ems && handleImport('ems', fileUploads.ems)}
                    importing={importing}
                    color="green"
                  />
                </div>
                
                <div className="p-4 bg-slate-800/50 rounded-md text-sm text-slate-300 border border-slate-700/50">
                  <p className="flex items-center gap-2">
                    <Wand2 className="h-4 w-4 text-purple-400" />
                    Import CSV files for emergency services. Files must contain headers matching the expected format.
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
