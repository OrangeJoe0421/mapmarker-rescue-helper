
import React, { useEffect } from 'react';
import { useMapStore } from '../../../store/useMapStore';

interface MapClickHandlersProps {
  view: __esri.MapView | null;
  clickHandleRef: React.MutableRefObject<__esri.Handle | null>;
}

const MapClickHandlers: React.FC<MapClickHandlersProps> = ({ 
  view, 
  clickHandleRef 
}) => {
  const { addingMarker, addCustomMarker } = useMapStore();
  
  // Create a click handler for the map to use with new marker creation
  useEffect(() => {
    if (!view) return;
    
    // Clean up previous click handler
    if (clickHandleRef.current) {
      clickHandleRef.current.remove();
      clickHandleRef.current = null;
    }
    
    // Add new click handler if in adding marker mode
    if (addingMarker) {
      const clickHandler = view.on("click", (event) => {
        if (!addingMarker) return;
        
        const { mapPoint } = event;
        addCustomMarker({
          name: 'New Marker',
          latitude: mapPoint.latitude,
          longitude: mapPoint.longitude,
          color: '#3B82F6',
        });
      });
      
      clickHandleRef.current = clickHandler;
      
      return () => {
        if (clickHandleRef.current) {
          clickHandleRef.current.remove();
          clickHandleRef.current = null;
        }
      };
    }
  }, [view, addingMarker, addCustomMarker, clickHandleRef]);
  
  return null;
};

export default MapClickHandlers;
