
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
import '@arcgis/core/assets/esri/themes/light/main.css';

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
  
  const { 
    mapCenter, 
    mapZoom, 
    userLocation, 
    emergencyServices, 
    customMarkers,
    routes,
    calculateRoute 
  } = useMapStore();
  
  // Initialize map
  useEffect(() => {
    if (!mapDiv.current || mapRef.current) return;
    
    // Import CSS
    import('@arcgis/core/assets/esri/themes/light/main.css');
    
    // Create the map
    const map = new Map({
      basemap: "streets-navigation-vector" // Use a navigation-optimized basemap
    });
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
      container: mapDiv.current,
      map: map,
      center: [mapCenter[1], mapCenter[0]], // ArcGIS uses [longitude, latitude]
      zoom: mapZoom,
      constraints: {
        minZoom: 3,
        maxZoom: 18
      }
    });
    
    viewRef.current = view;
    
    // Configure the routing service URL
    const routeUrl = "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World";
    
    // Set the API key for the services
    (window as any).esriConfig = {
      apiKey: API_KEY
    };
    
    // Setup click handlers for markers for routing functionality
    view.on("click", (event) => {
      // Use hitTest to find if a graphic was clicked
      view.hitTest(event).then(response => {
        // Check if we have graphics in the hit test result
        if (response.results.length > 0) {
          // Get the first graphic from the result
          const graphic = response.results.filter(result => {
            return result.graphic.layer === graphicsLayer;
          })[0]?.graphic;
          
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
            
            // Add new route action
            view.popup.actions.add({
              title: "Route to Project Location",
              id: "route-to-project",
              className: "esri-icon-directions",
              type: "button",
              visible: true,
            });
            
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
    
    // Clean up function
    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
      mapRef.current = null;
      graphicsLayerRef.current = null;
      routeLayerRef.current = null;
    };
  }, []);
  
  // Update map center and zoom when they change
  useEffect(() => {
    if (!viewRef.current) return;
    viewRef.current.goTo({
      center: [mapCenter[1], mapCenter[0]], // ArcGIS uses [longitude, latitude]
      zoom: mapZoom
    });
  }, [mapCenter, mapZoom]);
  
  // Update markers when they change
  useEffect(() => {
    if (!graphicsLayerRef.current) return;
    
    const graphicsLayer = graphicsLayerRef.current;
    graphicsLayer.removeAll();
    
    // Add user location marker if it exists
    if (userLocation) {
      const point = new Point({
        longitude: userLocation.longitude,
        latitude: userLocation.latitude
      });
      
      const markerSymbol = {
        type: "simple-marker" as "simple-marker",
        color: [56, 168, 0], // RGB for green
        outline: {
          color: [255, 255, 255], // White
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
        },
        popupTemplate: {
          title: "Project Location",
          content: [
            {
              type: "fields",
              fieldInfos: [
                { fieldName: "name", label: "Name" }
              ]
            }
          ]
        }
      });
      
      graphicsLayer.add(graphic);
    }
    
    // Add emergency service markers
    emergencyServices.forEach(service => {
      const point = new Point({
        longitude: service.longitude,
        latitude: service.latitude
      });
      
      // Choose color based on service type
      let color = [66, 135, 245]; // Default blue
      if (service.type.toLowerCase().includes('hospital')) {
        color = [220, 20, 60]; // Crimson for hospitals
      } else if (service.type.toLowerCase().includes('fire')) {
        color = [255, 69, 0]; // Red/orange for fire
      } else if (service.type.toLowerCase().includes('police') || service.type.toLowerCase().includes('law')) {
        color = [0, 0, 139]; // Dark blue for police
      } else if (service.type.toLowerCase().includes('ems')) {
        color = [255, 165, 0]; // Orange for EMS
      }
      
      const markerSymbol = {
        type: "simple-marker" as "simple-marker",
        color: color,
        outline: {
          color: [255, 255, 255], // White
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
        },
        popupTemplate: {
          title: "{name}",
          content: [
            {
              type: "fields",
              fieldInfos: [
                { fieldName: "serviceType", label: "Type" }
              ]
            }
          ]
        }
      });
      
      graphicsLayer.add(graphic);
    });
    
    // Add custom markers
    customMarkers.forEach(marker => {
      const point = new Point({
        longitude: marker.longitude,
        latitude: marker.latitude
      });
      
      const markerSymbol = {
        type: "simple-marker" as "simple-marker",
        color: marker.color || [59, 130, 246], // Use marker color or default blue
        outline: {
          color: [255, 255, 255], // White
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
          name: marker.name
        },
        popupTemplate: {
          title: "{name}",
          content: [
            {
              type: "fields",
              fieldInfos: [
                { fieldName: "name", label: "Name" }
              ]
            }
          ]
        }
      });
      
      graphicsLayer.add(graphic);
    });
  }, [userLocation, emergencyServices, customMarkers]);
  
  // Update routes when they change
  useEffect(() => {
    if (!routeLayerRef.current) return;
    
    const routeLayer = routeLayerRef.current;
    routeLayer.removeAll();
    
    routes.forEach(route => {
      // Convert route points to ArcGIS path format
      const paths = route.points.map(point => [point.longitude, point.latitude]);
      
      const polyline = new Polyline({
        paths: [paths]
      });
      
      const routeSymbol = {
        type: "simple-line" as "simple-line",
        color: [59, 130, 246], // Blue
        width: 4
      };
      
      const graphic = new Graphic({
        geometry: polyline,
        symbol: routeSymbol,
        attributes: {
          id: route.id,
          distance: route.distance,
          duration: route.duration
        },
        popupTemplate: {
          title: "Route",
          content: [
            {
              type: "fields",
              fieldInfos: [
                { fieldName: "distance", label: "Distance (km)" },
                { fieldName: "duration", label: "Duration (min)" }
              ]
            }
          ]
        }
      });
      
      routeLayer.add(graphic);
    });
  }, [routes]);
  
  // Create a click handler for the map to use with new marker creation
  useEffect(() => {
    if (!viewRef.current) return;
    
    const { addingMarker, addCustomMarker } = useMapStore.getState();
    
    // Clean up previous click handler
    if (clickHandleRef.current) {
      clickHandleRef.current.remove();
      clickHandleRef.current = null;
    }
    
    // Add new click handler if in adding marker mode
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
      className={`h-full w-full ${className || ''}`}
      style={{ height: '100%', width: '100%' }}
    />
  );
};

export default ArcGISMap;
