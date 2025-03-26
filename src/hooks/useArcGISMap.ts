
import { useEffect, useRef } from 'react';
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import '@arcgis/core/assets/esri/themes/light/main.css';
import { DEFAULT_MAP_CONFIG, API_KEY } from '../utils/arcgis/config';

interface UseArcGISMapProps {
  mapCenter: [number, number];
  mapZoom: number;
}

export const useArcGISMap = ({ mapCenter, mapZoom }: UseArcGISMapProps) => {
  const mapRef = useRef<Map | null>(null);
  const viewRef = useRef<MapView | null>(null);
  const graphicsLayerRef = useRef<GraphicsLayer | null>(null);
  const routeLayerRef = useRef<GraphicsLayer | null>(null);
  const clickHandleRef = useRef<__esri.Handle | null>(null);

  // Initialize the map
  useEffect(() => {
    // Set the API key for the services
    (window as any).esriConfig = {
      apiKey: API_KEY
    };
    
    // Import CSS
    import('@arcgis/core/assets/esri/themes/light/main.css');
  }, []);

  // Setup map with container ref
  const setupMap = (containerRef: HTMLDivElement) => {
    if (!containerRef || mapRef.current) return;
    
    // Create the map
    const map = new Map(DEFAULT_MAP_CONFIG);
    mapRef.current = map;
    
    // Create the graphics layers
    const graphicsLayer = new GraphicsLayer();
    const routeLayer = new GraphicsLayer();
    map.add(routeLayer);
    map.add(graphicsLayer);
    graphicsLayerRef.current = graphicsLayer;
    routeLayerRef.current = routeLayer;
    
    // Create the view
    const view = new MapView({
      container: containerRef,
      map: map,
      center: [mapCenter[1], mapCenter[0]], // ArcGIS uses [longitude, latitude]
      zoom: mapZoom,
      constraints: {
        minZoom: 3,
        maxZoom: 18
      }
    });
    
    viewRef.current = view;
    
    // Return cleanup function
    return () => {
      if (clickHandleRef.current) {
        clickHandleRef.current.remove();
        clickHandleRef.current = null;
      }
      
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
      
      mapRef.current = null;
      graphicsLayerRef.current = null;
      routeLayerRef.current = null;
    };
  };

  // Update map center and zoom when they change
  useEffect(() => {
    if (!viewRef.current) return;
    
    viewRef.current.goTo({
      center: [mapCenter[1], mapCenter[0]], // ArcGIS uses [longitude, latitude]
      zoom: mapZoom
    });
  }, [mapCenter, mapZoom]);

  return {
    setupMap,
    mapRef,
    viewRef,
    graphicsLayerRef,
    routeLayerRef,
    clickHandleRef
  };
};
