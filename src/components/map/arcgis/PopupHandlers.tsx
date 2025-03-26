
import React, { useEffect } from 'react';
import { useMapStore } from '../../../store/useMapStore';

interface PopupHandlersProps {
  view: __esri.MapView | null;
  graphicsLayer: __esri.GraphicsLayer | null;
}

const PopupHandlers: React.FC<PopupHandlersProps> = ({ view, graphicsLayer }) => {
  const { userLocation, calculateRoute } = useMapStore();
  
  useEffect(() => {
    if (!view || !graphicsLayer) return;
    
    // Setup click handlers for markers for routing functionality
    const clickHandler = view.on("click", (event) => {
      // Use hitTest to find if a graphic was clicked
      view.hitTest(event).then(response => {
        // Check if we have graphics in the hit test result
        if (response.results.length > 0) {
          // Get the first graphic from the result
          const graphicResults = response.results.filter(result => {
            // Type assertion to access the graphic property safely
            const hitResult = result as any;
            return hitResult.graphic && hitResult.graphic.layer === graphicsLayer;
          });
          
          if (graphicResults.length === 0) return;
          
          // Use type assertion to access the graphic
          const hitResult = graphicResults[0] as any;
          const graphic = hitResult.graphic;
          
          if (!graphic || !graphic.attributes) return;
          
          // Get the clicked graphic's ID
          const id = graphic.attributes.id;
          if (!id) return;
          
          // Check if it's a service or custom marker
          const isService = graphic.attributes.type === 'service';
          const isCustom = graphic.attributes.type === 'custom';
          
          // If it's a service or custom marker, show popup with route option
          if ((isService || isCustom) && userLocation) {
            view.popup.open({
              features: [graphic],
              location: event.mapPoint
            });
            
            // Clear existing actions
            view.popup.actions.removeAll();
            
            // Create a proper ActionButton instance
            const routeAction = {
              title: "Route to Project Location",
              id: "route-to-project",
              className: "esri-icon-directions"
            };
            
            // Add the action to the popup
            view.popup.actions.add(routeAction as any);
            
            // Set up click handler for the action
            view.popup.on("trigger-action", (event) => {
              if (event.action.id === "route-to-project") {
                calculateRoute(id, true);
                view.popup.close();
              }
            });
          }
        }
      });
    });
    
    // Return a cleanup function
    return () => {
      if (clickHandler) {
        clickHandler.remove();
      }
    };
  }, [view, graphicsLayer, userLocation, calculateRoute]);
  
  return null;
};

export default PopupHandlers;
