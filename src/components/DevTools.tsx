
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import PasswordGate from "./PasswordGate";
import { useToast } from "./ui/use-toast";
import { toast } from "sonner";
import { Database } from "@/types/database";

// Custom WizardIcon SVG component that looks like the provided image
const WizardIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Wizard hat */}
    <path 
      d="M12 2L8 10H16L12 2Z" 
      fill="currentColor" 
      stroke="currentColor"
    />
    
    {/* Wizard face/beard */}
    <path 
      d="M8 10C8 10 7 12 7 14C7 17 9 19 12 19C15 19 17 17 17 14C17 12 16 10 16 10" 
      fill="none"
    />
    
    {/* Eyes */}
    <circle cx="10" cy="12" r="0.5" fill="currentColor" />
    <circle cx="14" cy="12" r="0.5" fill="currentColor" />
    
    {/* Robe bottom */}
    <path 
      d="M9 19L7 23M15 19L17 23" 
      stroke="currentColor"
      strokeWidth="1.5"
    />
    
    {/* Magic sparkles */}
    <path 
      d="M20 4L21 5M4 4L3 5M5 9L3 8M19 9L21 8" 
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
);

type EmergencyServiceImport = {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  address?: string;
  phone?: string;
  hours?: string;
};

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

  const handleImport = async (type: string, file: File) => {
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        if (!e.target?.result) return;
        
        const data = JSON.parse(e.target.result as string) as EmergencyServiceImport[];
        
        // Process data in chunks to avoid timeout issues
        const chunkSize = 100;
        const chunks = [];
        
        for (let i = 0; i < data.length; i += chunkSize) {
          chunks.push(data.slice(i, i + chunkSize));
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
        
        toast.success(`Imported ${importedCount} ${type} services`, {
          description: errorCount > 0 ? `${errorCount} records had errors` : undefined
        });
      } catch (err) {
        console.error('Error parsing JSON:', err);
        toast.error(`Failed to import ${type} services`);
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
        <WizardIcon />
        <span>Dev Tools</span>
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px] bg-gradient-to-br from-slate-900 to-slate-800 border-purple-500/20">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <WizardIcon />
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
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2 bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
                    <label className="text-sm font-medium text-purple-200 flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-400"></div>
                      Hospitals
                    </label>
                    <div className="flex flex-col gap-2">
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleFileChange('hospitals')}
                        className="text-sm text-slate-300 bg-slate-700/50 rounded p-1.5 border border-slate-600"
                      />
                      <Button 
                        size="sm"
                        disabled={!fileUploads.hospitals || importing}
                        onClick={() => fileUploads.hospitals && handleImport('hospitals', fileUploads.hospitals)}
                        className="w-full bg-purple-500/20 hover:bg-purple-500/40 text-purple-200 border-purple-500/30"
                      >
                        Import
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
                    <label className="text-sm font-medium text-purple-200 flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                      Fire Stations
                    </label>
                    <div className="flex flex-col gap-2">
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleFileChange('fire')}
                        className="text-sm text-slate-300 bg-slate-700/50 rounded p-1.5 border border-slate-600"
                      />
                      <Button 
                        size="sm"
                        disabled={!fileUploads.fire || importing}
                        onClick={() => fileUploads.fire && handleImport('fire', fileUploads.fire)}
                        className="w-full bg-purple-500/20 hover:bg-purple-500/40 text-purple-200 border-purple-500/30"
                      >
                        Import
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
                    <label className="text-sm font-medium text-purple-200 flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                      Police Stations
                    </label>
                    <div className="flex flex-col gap-2">
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleFileChange('police')}
                        className="text-sm text-slate-300 bg-slate-700/50 rounded p-1.5 border border-slate-600"
                      />
                      <Button 
                        size="sm"
                        disabled={!fileUploads.police || importing}
                        onClick={() => fileUploads.police && handleImport('police', fileUploads.police)}
                        className="w-full bg-purple-500/20 hover:bg-purple-500/40 text-purple-200 border-purple-500/30"
                      >
                        Import
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
                    <label className="text-sm font-medium text-purple-200 flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      EMS
                    </label>
                    <div className="flex flex-col gap-2">
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleFileChange('ems')}
                        className="text-sm text-slate-300 bg-slate-700/50 rounded p-1.5 border border-slate-600"
                      />
                      <Button 
                        size="sm"
                        disabled={!fileUploads.ems || importing}
                        onClick={() => fileUploads.ems && handleImport('ems', fileUploads.ems)}
                        className="w-full bg-purple-500/20 hover:bg-purple-500/40 text-purple-200 border-purple-500/30"
                      >
                        Import
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-slate-800/50 rounded-md text-sm text-slate-300 border border-slate-700/50">
                  <p className="flex items-center gap-2">
                    <WizardIcon />
                    Import JSON files for emergency services. Files should contain arrays of objects with id, name, type, latitude, and longitude fields.
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
