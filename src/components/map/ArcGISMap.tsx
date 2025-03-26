
import React, { useEffect, useRef } from 'react';
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import Graphic from '@arcgis/core/Graphic';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Point from '@arcgis/core/geometry/Point';
import Polyline from '@arcgis/core/geometry/Polyline';
import RouteParameters from '@arcgis/core/rest/support/RouteParameters';
import FeatureSet from '@arcgis/core/rest/support/FeatureSet';
import * as route from '@arcgis/core/rest/route';
import { useMapStore } from '../../store/useMapStore';
import { EmergencyService } from '@/types/mapTypes';
import '@arcgis/core/assets/esri/themes/light/main.css';
import ReactDOMServer from 'react-dom/server';

// ArcGIS API key
const API_KEY = "AAPTxy8BH1VEsoebNVZXo8HurCbu3PSv3KJX_DDuDrGaWyOyZnym1CFeYHigp3dhVT4zBgjJbDsJUCe7vqw1hQGldb_lzf_oL_0CpilyHp1uyF0r1yQ1IHIpP72F5YK8UvUPS4oZ94EIsi3fAf4_GaRAZ6mr_hhxSP08zDf8Cpv4DHJWtKSgFW-osce6JCuJ650apzqq7Ajb0SYralTMuDtL6bUXyLBiVIaUAlqznUoV1dQ.AT1_aTQtmsBa";

interface ArcGISMapProps {
  className?: string;
}

const ArcGISMap: React.FC<ArcGISMapProps> = ({ className }) => {
  const mapDiv = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const viewRef = useRef<MapView | null>(null);
  const graphicsLayerRef = useRef<GraphicsLayer | null>(null);
  const routeLayerRef = useRef<GraphicsLayer | null>(null);
  const clickHandleRef = useRef<__esri.Handle | null>(null);
  const draggingRef = useRef<boolean>(false);
  const currentMarkerRef = useRef<string | null>(null);
  
  const { 
    mapCenter, 
    mapZoom, 
    userLocation, 
    emergencyServices, 
    customMarkers,
    routes,
    calculateRoute,
    selectService,
    setDraggingMarker,
    updateMarkerPosition
  } = useMapStore();
  
  useEffect(() => {
    if (!mapDiv.current || mapRef.current) return;
    
    import('@arcgis/core/assets/esri/themes/light/main.css');
    
    (window as any).esriConfig = {
      apiKey: API_KEY
    };
    
    const map = new Map({
      basemap: "streets-navigation-vector"
    });
    mapRef.current = map;
    
    const graphicsLayer = new GraphicsLayer();
    const routeLayer = new GraphicsLayer();
    map.add(routeLayer);
    map.add(graphicsLayer);
    graphicsLayerRef.current = graphicsLayer;
    routeLayerRef.current = routeLayer;
    
    const view = new MapView({
      container: mapDiv.current,
      map: map,
      center: [mapCenter[1], mapCenter[0]],
      zoom: mapZoom,
      constraints: {
        minZoom: 3,
        maxZoom: 18
      }
    });
    
    viewRef.current = view;
    
    (window as any).__arcgisView = view;
    
    view.when(() => {
      try {
        (view as any).allLayersVisibleForScreenshot = true;
        console.info("ArcGIS screenshot capability enabled");
      } catch (error) {
        console.error("Error enabling ArcGIS screenshot:", error);
      }
    });
    
    const routeUrl = "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World";
    
    view.on("click", (event) => {
      view.hitTest(event).then(response => {
        if (response.results.length > 0) {
          const graphicResults = response.results.filter(result => {
            const hitResult = result as any;
            return hitResult.graphic && hitResult.graphic.layer === graphicsLayer;
          });
          
          if (graphicResults.length === 0) return;
          
          const hitResult = graphicResults[0] as any;
          const graphic = hitResult.graphic;
          
          if (!graphic || !graphic.attributes) return;
          
          const id = graphic.attributes.id;
          if (!id) return;
          
          const isService = graphic.attributes.type === 'service';
          const isCustom = graphic.attributes.type === 'custom';
          
          if (isService) {
            const service = emergencyServices.find(s => s.id === id);
            if (service) {
              selectService(service);
              const tabsElement = document.querySelector('[value="results"]') as HTMLButtonElement;
              if (tabsElement) {
                tabsElement.click();
              }
              view.popup.close();
            }
          } else if (isCustom || id === 'user-location') {
            let marker;
            let title = '';
            let details = '';
            
            if (id === 'user-location') {
              title = 'Project Location';
              details = userLocation?.metadata ? 
                `<p>Project Number: ${userLocation.metadata.projectNumber || 'N/A'}</p>
                 <p>Region: ${userLocation.metadata.region || 'N/A'}</p>
                 <p>Project Type: ${userLocation.metadata.projectType || 'N/A'}</p>` : '';
            } else {
              marker = customMarkers.find(m => m.id === id);
              if (marker) {
                title = marker.name;
                details = marker.metadata ? 
                  `<p>Project Number: ${marker.metadata.projectNumber || 'N/A'}</p>
                   <p>Region: ${marker.metadata.region || 'N/A'}</p>
                   <p>Project Type: ${marker.metadata.projectType || 'N/A'}</p>` : '';
              }
            }
            
            const popupContent = `
              <div class="esri-popup-content custom-popup">
                <h3 class="font-bold text-lg">${title}</h3>
                ${details}
              </div>
            `;
            
            view.popup.open({
              location: event.mapPoint,
              content: popupContent
            });
          }
        } else {
          view.popup.close();
        }
      });
    });
    
    return () => {
      if (viewRef.current) {
        if ((window as any).__arcgisView === viewRef.current) {
          (window as any).__arcgisView = null;
        }
        
        delete (window as any).verifyEmergencyRoom;
        delete (window as any).calculateRouteToProject;
        
        viewRef.current.destroy();
        viewRef.current = null;
      }
      mapRef.current = null;
      graphicsLayerRef.current = null;
      routeLayerRef.current = null;
    };
  }, []);
  
  useEffect(() => {
    if (!viewRef.current) return;
    try {
      viewRef.current.goTo({
        center: [mapCenter[1], mapCenter[0]],
        zoom: mapZoom
      });
    } catch (error) {
      console.error("Error updating map center/zoom:", error);
    }
  }, [mapCenter, mapZoom]);
  
  useEffect(() => {
    if (!graphicsLayerRef.current || !viewRef.current) return;
    
    const graphicsLayer = graphicsLayerRef.current;
    const view = viewRef.current;
    graphicsLayer.removeAll();
    
    if (userLocation) {
      const point = new Point({
        longitude: userLocation.longitude,
        latitude: userLocation.latitude
      });
      
      const markerSymbol = {
        type: "simple-marker" as "simple-marker",
        color: [56, 168, 0],
        outline: {
          color: [255, 255, 255],
          width: 2
        },
        size: 12
      };
      
      const graphic = new Graphic({
        geometry: point,
        symbol: markerSymbol,
        attributes: {
          id: "user-location",
          type: "user",
          name: "Project Location"
        }
      });
      
      graphicsLayer.add(graphic);
    }
    
    emergencyServices.forEach(service => {
      const point = new Point({
        longitude: service.longitude,
        latitude: service.latitude
      });
      
      let color = [66, 135, 245];
      if (service.type.toLowerCase().includes('hospital')) {
        color = [220, 20, 60];
      } else if (service.type.toLowerCase().includes('fire')) {
        color = [255, 69, 0];
      } else if (service.type.toLowerCase().includes('police') || service.type.toLowerCase().includes('law')) {
        color = [0, 0, 139];
      } else if (service.type.toLowerCase().includes('ems')) {
        color = [255, 165, 0];
      }
      
      const markerSymbol = {
        type: "simple-marker" as "simple-marker",
        color: color,
        outline: {
          color: [255, 255, 255],
          width: 1
        },
        size: 12
      };
      
      const graphic = new Graphic({
        geometry: point,
        symbol: markerSymbol,
        attributes: {
          id: service.id,
          type: "service",
          name: service.name,
          serviceType: service.type
        }
      });
      
      graphicsLayer.add(graphic);
    });
    
    customMarkers.forEach(marker => {
      const point = new Point({
        longitude: marker.longitude,
        latitude: marker.latitude
      });
      
      const markerSymbol = {
        type: "simple-marker" as "simple-marker",
        color: marker.color ? marker.color.replace('#', '').match(/.{1,2}/g)?.map(hex => parseInt(hex, 16)) || [59, 130, 246] : [59, 130, 246],
        outline: {
          color: [255, 255, 255],
          width: 1
        },
        size: 12
      };
      
      const graphic = new Graphic({
        geometry: point,
        symbol: markerSymbol,
        attributes: {
          id: marker.id,
          type: "custom",
          name: marker.name,
          metadata: JSON.stringify(marker.metadata || {}),
          draggable: "true"
        }
      });
      
      graphicsLayer.add(graphic);
    });
    
    let dragHandler: __esri.Handle;
    let dragStartHandler: __esri.Handle;
    let dragEndHandler: __esri.Handle;
    let mapNavigationEnabled = true;

    if (dragHandler) dragHandler.remove();
    if (dragStartHandler) dragStartHandler.remove();
    if (dragEndHandler) dragEndHandler.remove();
    
    dragStartHandler = view.on("pointer-down", (event) => {
      if (draggingRef.current) return;
      
      view.hitTest(event).then(response => {
        if (response.results.length > 0) {
          const graphicResults = response.results.filter(result => {
            const hitResult = result as any;
            return hitResult.graphic && 
                   hitResult.graphic.layer === graphicsLayer && 
                   hitResult.graphic.attributes && 
                   hitResult.graphic.attributes.type === "custom";
          });
          
          if (graphicResults.length === 0) return;
          
          const hitResult = graphicResults[0] as any;
          const graphic = hitResult.graphic;
          
          if (!graphic || !graphic.attributes) return;
          
          const id = graphic.attributes.id;
          if (!id) return;
          
          draggingRef.current = true;
          currentMarkerRef.current = id;
          setDraggingMarker(id);
          
          // Store current navigation state
          mapNavigationEnabled = view.navigation ? true : false;
          
          // Disable map navigation while dragging
          if (view.navigation) {
            view.navigation.mouseWheelZoomEnabled = false;
            view.navigation.browserTouchPanEnabled = false;
          }
          
          mapDiv.current!.style.cursor = 'grabbing';
          event.stopPropagation();
        }
      });
    });
    
    dragHandler = view.on("pointer-move", (event) => {
      if (!draggingRef.current || !currentMarkerRef.current) return;
      
      const point = view.toMap({x: event.x, y: event.y});
      
      graphicsLayer.graphics.forEach(graphic => {
        if (graphic.attributes?.id === currentMarkerRef.current) {
          graphic.geometry = point;
        }
      });
      
      event.stopPropagation();
    });
    
    dragEndHandler = view.on("pointer-up", (event) => {
      if (!draggingRef.current || !currentMarkerRef.current) return;
      
      const point = view.toMap({x: event.x, y: event.y});
      
      updateMarkerPosition(
        currentMarkerRef.current,
        point.latitude,
        point.longitude
      );
      
      draggingRef.current = false;
      currentMarkerRef.current = null;
      
      // Re-enable map navigation after dragging
      if (view.navigation) {
        view.navigation.mouseWheelZoomEnabled = true;
        view.navigation.browserTouchPanEnabled = true;
      }
      
      mapDiv.current!.style.cursor = 'auto';
      
      event.stopPropagation();
    });
    
    return () => {
      if (dragHandler) dragHandler.remove();
      if (dragStartHandler) dragStartHandler.remove();
      if (dragEndHandler) dragEndHandler.remove();
      
      // Make sure navigation is re-enabled when component unmounts
      if (viewRef.current && viewRef.current.navigation) {
        viewRef.current.navigation.mouseWheelZoomEnabled = true;
        viewRef.current.navigation.browserTouchPanEnabled = true;
      }
    };
  }, [customMarkers, userLocation, emergencyServices, setDraggingMarker, updateMarkerPosition]);
  
  useEffect(() => {
    if (!routeLayerRef.current) return;
    
    const routeLayer = routeLayerRef.current;
    routeLayer.removeAll();
    
    routes.forEach(route => {
      const paths = route.points.map(point => [point.longitude, point.latitude]);
      
      const polyline = new Polyline({
        paths: [paths]
      });
      
      const routeSymbol = {
        type: "simple-line" as "simple-line",
        color: [255, 59, 48],
        width: 4
      };
      
      const graphic = new Graphic({
        geometry: polyline,
        symbol: routeSymbol,
        attributes: {
          id: route.id,
          distance: route.distance,
          duration: route.duration,
          type: 'route'
        }
      });
      
      routeLayer.add(graphic);
    });
  }, [routes]);
  
  useEffect(() => {
    if (!viewRef.current) return;
    
    const { addingMarker, addCustomMarker } = useMapStore.getState();
    
    if (clickHandleRef.current) {
      clickHandleRef.current.remove();
      clickHandleRef.current = null;
    }
    
    if (addingMarker) {
      const clickHandler = viewRef.current.on("click", (event) => {
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
  }, [useMapStore.getState().addingMarker]);
  
  return (
    <div 
      ref={mapDiv} 
      className={`h-full w-full relative ${className || ''}`}
      style={{ height: '100%', width: '100%' }}
    />
  );
};

export default ArcGISMap;
