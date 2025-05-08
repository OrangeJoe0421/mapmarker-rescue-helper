
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import PasswordGate from "./PasswordGate";
import { useToast } from "./ui/use-toast";
import { toast } from "sonner";
import { Database } from "@/types/database";

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
        className="gap-2" 
        onClick={() => setOpen(true)}
      >
        Dev Tools
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Developer Tools</DialogTitle>
          </DialogHeader>
          
          {!authenticated ? (
            <PasswordGate onCorrectPassword={handlePasswordSuccess} />
          ) : (
            <Tabs defaultValue="import" className="w-full">
              <TabsList className="grid w-full grid-cols-1">
                <TabsTrigger value="import">Data Import</TabsTrigger>
              </TabsList>
              
              <TabsContent value="import" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Hospitals</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleFileChange('hospitals')}
                          className="text-sm"
                        />
                        <Button 
                          size="sm"
                          disabled={!fileUploads.hospitals || importing}
                          onClick={() => fileUploads.hospitals && handleImport('hospitals', fileUploads.hospitals)}
                        >
                          Import
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Fire Stations</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleFileChange('fire')}
                          className="text-sm"
                        />
                        <Button 
                          size="sm"
                          disabled={!fileUploads.fire || importing}
                          onClick={() => fileUploads.fire && handleImport('fire', fileUploads.fire)}
                        >
                          Import
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Police Stations</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleFileChange('police')}
                          className="text-sm"
                        />
                        <Button 
                          size="sm"
                          disabled={!fileUploads.police || importing}
                          onClick={() => fileUploads.police && handleImport('police', fileUploads.police)}
                        >
                          Import
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">EMS</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleFileChange('ems')}
                          className="text-sm"
                        />
                        <Button 
                          size="sm"
                          disabled={!fileUploads.ems || importing}
                          onClick={() => fileUploads.ems && handleImport('ems', fileUploads.ems)}
                        >
                          Import
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-muted/50 rounded-md text-sm text-muted-foreground">
                    <p>Import JSON files for emergency services. Files should contain arrays of objects with id, name, type, latitude, and longitude fields.</p>
                    <p className="mt-2">Data will be upserted into the database, updating existing records based on ID.</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
