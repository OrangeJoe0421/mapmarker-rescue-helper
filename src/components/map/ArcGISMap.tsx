
import React, { useRef } from 'react';
import { useMapStore } from '../../store/useMapStore';
import { useArcGISMap } from '../../hooks/useArcGISMap';
import UserLocationMarker from './arcgis/UserLocationMarker';
import EmergencyServiceMarkers from './arcgis/EmergencyServiceMarkers';
import CustomMarkers from './arcgis/CustomMarkers';
import RouteLines from './arcgis/RouteLines';
import PopupHandlers from './arcgis/PopupHandlers';
import MapClickHandlers from './arcgis/MapClickHandlers';

interface ArcGISMapProps {
  className?: string;
}

const ArcGISMap: React.FC<ArcGISMapProps> = ({ className }) => {
  const mapDiv = useRef<HTMLDivElement>(null);
  const { 
    mapCenter, 
    mapZoom, 
    userLocation, 
    emergencyServices, 
    customMarkers,
    routes,
  } = useMapStore();
  
  // Use our custom hook to manage the map
  const {
    setupMap,
    viewRef,
    graphicsLayerRef,
    routeLayerRef,
    clickHandleRef
  } = useArcGISMap({ mapCenter, mapZoom });
  
  // Initialize the map when the component mounts
  React.useEffect(() => {
    if (!mapDiv.current) return;
    
    // Initialize the map with the container
    const cleanup = setupMap(mapDiv.current);
    
    return cleanup;
  }, [setupMap]);
  
  return (
    <div 
      ref={mapDiv} 
      className={`h-full w-full ${className || ''}`}
      style={{ height: '100%', width: '100%' }}
    >
      {/* Component to handle user location markers */}
      <UserLocationMarker 
        userLocation={userLocation} 
        graphicsLayer={graphicsLayerRef.current} 
      />
      
      {/* Component to handle emergency service markers */}
      <EmergencyServiceMarkers 
        services={emergencyServices} 
        graphicsLayer={graphicsLayerRef.current} 
      />
      
      {/* Component to handle custom markers */}
      <CustomMarkers 
        markers={customMarkers} 
        graphicsLayer={graphicsLayerRef.current} 
      />
      
      {/* Component to handle route lines */}
      <RouteLines 
        routes={routes} 
        routeLayer={routeLayerRef.current} 
      />
      
      {/* Component to handle popup interactions */}
      <PopupHandlers 
        view={viewRef.current} 
        graphicsLayer={graphicsLayerRef.current} 
      />
      
      {/* Component to handle map click interactions */}
      <MapClickHandlers 
        view={viewRef.current} 
        clickHandleRef={clickHandleRef} 
      />
    </div>
  );
};

export default ArcGISMap;
