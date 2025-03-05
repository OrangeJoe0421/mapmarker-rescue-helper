
import React, { useState, useEffect } from 'react';
import { useMapStore } from '@/store/useMapStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { CustomMarker, MarkerMetadata } from '@/types/mapTypes';
import { FileText, Hash, MapPin, Globe } from 'lucide-react';
import { toast } from 'sonner';

interface MarkerMetadataFormProps {
  marker: CustomMarker;
  onClose: () => void;
}

const MarkerMetadataForm = ({ marker, onClose }: MarkerMetadataFormProps) => {
  const { updateCustomMarker } = useMapStore();
  const [metadata, setMetadata] = useState<MarkerMetadata>({
    projectNumber: marker.metadata?.projectNumber || '',
    region: marker.metadata?.region || '',
    projectType: marker.metadata?.projectType || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out empty metadata fields
    const filteredMetadata: MarkerMetadata = {};
    
    if (metadata.projectNumber?.trim()) {
      filteredMetadata.projectNumber = metadata.projectNumber.trim();
    }
    
    if (metadata.region?.trim()) {
      filteredMetadata.region = metadata.region.trim();
    }
    
    if (metadata.projectType?.trim()) {
      filteredMetadata.projectType = metadata.projectType.trim();
    }
    
    // Update the marker with the new metadata
    updateCustomMarker(marker.id, { 
      metadata: Object.keys(filteredMetadata).length > 0 ? filteredMetadata : undefined
    });
    
    toast.success('Marker metadata updated');
    onClose();
  };

  return (
    <Card className="glass-card w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <span>Edit Marker Metadata</span>
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="projectNumber" className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Project Number
            </Label>
            <Input
              id="projectNumber"
              value={metadata.projectNumber}
              onChange={(e) => setMetadata({ ...metadata, projectNumber: e.target.value })}
              placeholder="e.g. PRJ-2023-001"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="region" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Region
            </Label>
            <Input
              id="region"
              value={metadata.region}
              onChange={(e) => setMetadata({ ...metadata, region: e.target.value })}
              placeholder="e.g. North-East"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="projectType" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Project Type
            </Label>
            <Input
              id="projectType"
              value={metadata.projectType}
              onChange={(e) => setMetadata({ ...metadata, projectType: e.target.value })}
              placeholder="e.g. Construction, Research, Survey"
            />
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            Save Metadata
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default MarkerMetadataForm;
