
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { importEmergencyServices, clearEmergencyServices } from '@/utils/dataImport';
import { toast } from 'sonner';
import { Progress } from './ui/progress';
import { AlertCircle, Upload, Trash2, Check } from 'lucide-react';
import { useMapStore } from '@/store/useMapStore';

const DataImporter = () => {
  const [selectedType, setSelectedType] = useState<string>('Hospital');
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setEmergencyServices } = useMapStore();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      setProgress(10);
      
      // Read the file
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          setProgress(30);
          const content = e.target?.result as string;
          const jsonData = JSON.parse(content);
          
          if (!Array.isArray(jsonData)) {
            toast.error('Invalid JSON format. Expected an array of objects.');
            return;
          }
          
          setProgress(50);
          await importEmergencyServices(jsonData, selectedType);
          setProgress(100);
          
          // Reset the file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          
          // Update the map services
          refetchServices();
        } catch (error) {
          console.error('Error processing file:', error);
          toast.error('Failed to process file');
        } finally {
          setIsImporting(false);
        }
      };
      
      reader.onerror = () => {
        toast.error('Failed to read file');
        setIsImporting(false);
      };
      
      reader.readAsText(file);
    } catch (error) {
      console.error('Error handling file:', error);
      setIsImporting(false);
    }
  };

  const handleClear = async () => {
    if (!confirm(`Are you sure you want to clear all ${selectedType} services?`)) return;
    
    try {
      setIsClearing(true);
      await clearEmergencyServices(selectedType);
      refetchServices();
    } catch (error) {
      console.error('Error clearing services:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const refetchServices = async () => {
    try {
      // Fetch updated services from Supabase
      const { data } = await fetchEmergencyServicesFromDB();
      if (data) {
        setEmergencyServices(data);
      }
    } catch (error) {
      console.error('Error fetching updated services:', error);
    }
  };

  const fetchEmergencyServicesFromDB = async () => {
    return await supabase
      .from('emergency_services')
      .select('*');
  };

  return (
    <Card className="w-full mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Import Emergency Services Data</CardTitle>
        <CardDescription>
          Upload JSON files containing emergency service data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="service-type">Service Type</Label>
            <Select
              value={selectedType}
              onValueChange={setSelectedType}
              disabled={isImporting || isClearing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select service type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Hospital">Hospitals</SelectItem>
                <SelectItem value="Fire Station">Fire Stations</SelectItem>
                <SelectItem value="EMS Station">EMS Stations</SelectItem>
                <SelectItem value="Law Enforcement">Law Enforcement</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="file-upload">JSON File</Label>
            <Input 
              id="file-upload"
              type="file"
              ref={fileInputRef}
              accept=".json"
              disabled={isImporting || isClearing}
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground">
              Select a JSON file with an array of service data
            </p>
          </div>
          
          {isImporting && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Importing data...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="destructive"
          size="sm"
          disabled={isImporting || isClearing}
          onClick={handleClear}
        >
          {isClearing ? (
            <>
              <Trash2 className="mr-2 h-4 w-4 animate-spin" />
              Clearing...
            </>
          ) : (
            <>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear {selectedType} Data
            </>
          )}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          disabled={isImporting || isClearing}
          onClick={() => fileInputRef.current?.click()}
        >
          {isImporting ? (
            <>
              <Upload className="mr-2 h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Select JSON File
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DataImporter;
