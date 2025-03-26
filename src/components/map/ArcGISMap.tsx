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
import EmergencyRoomVerification from '../EmergencyRoomVerification';
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
  
  const { 
    mapCenter, 
    mapZoom, 
    userLocation, 
    emergencyServices, 
    customMarkers,
    routes,
    calculateRoute,
    verifyEmergencyRoom
  } = useMapStore();
  
  // Initialize map
  useEffect(() => {
    if (!mapDiv.current || mapRef.current) return;
    
    // Import CSS
    import('@arcgis/core/assets/esri/themes/light/main.css');
    
    // Set up API key configuration
    (window as any).esriConfig = {
      apiKey: API_KEY
    };
    
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
    
    // Expose the view instance to the window object for MapCapture
    (window as any).__arcgisView = view;
    
    // Enable screenshot capability for takeScreenshot
    view.when(() => {
      try {
        // Enable screenshot by setting allowExportImageService to true
        (view as any).allLayersVisibleForScreenshot = true;
        console.info("ArcGIS screenshot capability enabled");
      } catch (error) {
        console.error("Error enabling ArcGIS screenshot:", error);
      }
    });
    
    // Configure the routing service URL
    const routeUrl = "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World";
    
    // Setup click handlers for markers for routing functionality
    view.on("click", (event) => {
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
          
          // Handle service marker click
          if (isService) {
            const service = emergencyServices.find(s => s.id === id);
            if (service) {
              // Create custom popup content with verification checkbox for hospitals
              let popupContent = `
                <div class="esri-popup-content custom-popup">
                  <h3 class="font-bold text-lg">${service.name}</h3>
                  <p class="text-sm">${service.type}</p>
              `;
              
              if (service.road_distance) {
                popupContent += `<p class="text-xs mt-1">${service.road_distance.toFixed(2)} km away</p>`;
              }
              
              if (service.address) {
                popupContent += `<p class="text-xs mt-1">${service.address}</p>`;
              }
              
              if (service.phone) {
                popupContent += `<p class="text-xs mt-1">Phone: ${service.phone}</p>`;
              }
              
              if (service.hours) {
                popupContent += `<p class="text-xs mt-1">Hours: ${service.hours}</p>`;
              }
              
              // Add the verification component for hospitals
              if (service.type.toLowerCase().includes('hospital')) {
                // Create a container for verification UI
                popupContent += `
                  <div class="mt-2 bg-gray-100 p-2 rounded">
                    <div class="flex items-center">
                      <input 
                        type="checkbox" 
                        id="er-verification-${service.id}" 
                        ${service.verification?.hasEmergencyRoom ? 'checked' : ''}
                        onclick="window.verifyEmergencyRoom('${service.id}', this.checked)"
                        class="mr-2"
                      />
                      <label for="er-verification-${service.id}" class="text-sm">
                        Verified Emergency Room
                      </label>
                    </div>
                `;
                
                if (service.verification?.verifiedAt) {
                  const date = new Date(service.verification.verifiedAt);
                  popupContent += `
                    <div class="text-xs text-gray-500 mt-1">
                      Verified on ${date.toLocaleDateString()}
                    </div>
                  `;
                }
                
                popupContent += '</div>';
              }
              
              // Add route button
              popupContent += `
                <div class="mt-3">
                  <button 
                    class="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
                    onclick="window.calculateRouteToProject('${service.id}')"
                  >
                    Route to Project
                  </button>
                </div>
              `;
              
              popupContent += '</div>';
              
              // Set up global functions for the verification and routing
              (window as any).verifyEmergencyRoom = (serviceId: string, checked: boolean) => {
                verifyEmergencyRoom(serviceId, checked);
                // Close and reopen the popup to refresh content
                view.popup.close();
                setTimeout(() => {
                  view.popup.open({
                    location: event.mapPoint,
                    content: popupContent
                  });
                }, 100);
              };
              
              (window as any).calculateRouteToProject = (serviceId: string) => {
                calculateRoute(serviceId, true);
                view.popup.close();
              };
              
              // Show the popup
              view.popup.open({
                location: event.mapPoint,
                content: popupContent
              });
            }
          } else if (isCustom || id === 'user-location') {
            // Handle custom marker or user location click
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
        }
      });
    });
    
    // Clean up function
    return () => {
      if (viewRef.current) {
        // Remove the view reference from the window object
        if ((window as any).__arcgisView === viewRef.current) {
          (window as any).__arcgisView = null;
        }
        
        // Clean up global functions
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
  
  // Update map center and zoom when they change
  useEffect(() => {
    if (!viewRef.current) return;
    try {
      viewRef.current.goTo({
        center: [mapCenter[1], mapCenter[0]], // ArcGIS uses [longitude, latitude]
        zoom: mapZoom
      });
    } catch (error) {
      console.error("Error updating map center/zoom:", error);
    }
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
          serviceType: service.type,
          address: service.address || '',
          phone: service.phone || '',
          hours: service.hours || '',
          distance: service.road_distance ? `${service.road_distance.toFixed(2)} km` : 'Unknown',
          hasEmergencyRoom: service.verification?.hasEmergencyRoom ? 'Yes' : 'No',
          verifiedAt: service.verification?.verifiedAt ? new Date(service.verification.verifiedAt).toLocaleDateString() : 'Not verified'
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
        color: marker.color ? marker.color.replace('#', '').match(/.{1,2}/g)?.map(hex => parseInt(hex, 16)) || [59, 130, 246] : [59, 130, 246],
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
          name: marker.name,
          metadata: JSON.stringify(marker.metadata || {})
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
        color: [255, 59, 48], // Red
        width: 4
      };
      
      const graphic = new Graphic({
        geometry: polyline,
        symbol: routeSymbol,
        attributes: {
          id: route.id,
          distance: route.distance,
          duration: route.duration,
          type: 'route' // Add a type to differentiate from markers
        }
      });
      
      // Routes don't need popups to make them non-interactive
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
