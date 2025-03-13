
import React, { useState } from 'react';
import LeafletMapMarkers from './LeafletMapMarkers';
import ArcGISMap from './map/ArcGISMap';
import { Button } from './ui/button';
import { MapIcon, RefreshCw } from 'lucide-react';
import { useToast } from './ui/use-toast';

// Flag to determine which map to use by default
const DEFAULT_USE_ARCGIS = false;

const MapContainer = () => {
  const [useArcGIS, setUseArcGIS] = useState(DEFAULT_USE_ARCGIS);
  const { toast } = useToast();
  
  const toggleMapProvider = () => {
    setUseArcGIS(!useArcGIS);
    toast({
      title: `Switched to ${!useArcGIS ? 'ArcGIS' : 'OpenStreetMap'} map`,
      description: `Now using ${!useArcGIS ? 'ArcGIS Online' : 'OpenStreetMap with OSRM'} for mapping and routing.`,
    });
  };
  
  return (
    <div className="h-[600px] w-full rounded-lg overflow-hidden border shadow-md relative">
      {useArcGIS ? <ArcGISMap /> : <LeafletMapMarkers />}
      
      <Button
        variant="secondary"
        size="sm"
        className="absolute top-3 right-14 z-[1000] bg-white/80 hover:bg-white"
        onClick={toggleMapProvider}
      >
        <MapIcon className="mr-1 h-4 w-4" />
        {useArcGIS ? 'Use OSM' : 'Use ArcGIS'}
      </Button>
      
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/80 px-2 py-1 rounded text-xs">
        {useArcGIS ? 'ArcGIS: Click markers to see route options' : 'OpenStreetMap: Click markers to see route options'}
      </div>
    </div>
  );
};

export default MapContainer;
