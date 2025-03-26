
// ArcGIS API key
export const API_KEY = "AAPTxy8BH1VEsoebNVZXo8HurCbu3PSv3KJX_DDuDrGaWyOyZnym1CFeYHigp3dhVT4zBgjJbDsJUCe7vqw1hQGldb_lzf_oL_0CpilyHp1uyF0r1yQ1IHIpP72F5YK8UvUPS4oZ94EIsi3fAf4_GaRAZ6mr_hhxSP08zDf8Cpv4DHJWtKSgFW-osce6JCuJ650apzqq7Ajb0SYralTMuDtL6bUXyLBiVIaUAlqznUoV1dQ.AT1_aTQtmsBa";

// Route service URL
export const ROUTE_SERVICE_URL = "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World";

// Map configuration
export const DEFAULT_MAP_CONFIG = {
  basemap: "streets-navigation-vector", // Use a navigation-optimized basemap
};

// Marker symbol configurations
export const MARKER_SYMBOLS = {
  user: {
    type: "simple-marker" as "simple-marker",
    color: [56, 168, 0], // RGB for green
    outline: {
      color: [255, 255, 255], // White
      width: 2
    },
    size: 12
  },
  service: {
    hospital: {
      type: "simple-marker" as "simple-marker",
      color: [220, 20, 60], // Crimson for hospitals
      outline: {
        color: [255, 255, 255], // White
        width: 1
      },
      size: 12
    },
    fire: {
      type: "simple-marker" as "simple-marker",
      color: [255, 69, 0], // Red/orange for fire
      outline: {
        color: [255, 255, 255], // White
        width: 1
      },
      size: 12
    },
    police: {
      type: "simple-marker" as "simple-marker",
      color: [0, 0, 139], // Dark blue for police
      outline: {
        color: [255, 255, 255], // White
        width: 1
      },
      size: 12
    },
    ems: {
      type: "simple-marker" as "simple-marker",
      color: [255, 165, 0], // Orange for EMS
      outline: {
        color: [255, 255, 255], // White
        width: 1
      },
      size: 12
    },
    default: {
      type: "simple-marker" as "simple-marker",
      color: [66, 135, 245], // Default blue
      outline: {
        color: [255, 255, 255], // White
        width: 1
      },
      size: 12
    }
  },
  custom: {
    type: "simple-marker" as "simple-marker",
    color: [59, 130, 246], // Blue
    outline: {
      color: [255, 255, 255], // White
      width: 1
    },
    size: 12
  },
  route: {
    type: "simple-line" as "simple-line",
    color: [59, 130, 246], // Blue
    width: 4
  }
};

// Helper to get service marker symbol based on service type
export const getServiceMarkerSymbol = (serviceType: string) => {
  const type = serviceType.toLowerCase();
  if (type.includes('hospital')) return MARKER_SYMBOLS.service.hospital;
  if (type.includes('fire')) return MARKER_SYMBOLS.service.fire;
  if (type.includes('police') || type.includes('law')) return MARKER_SYMBOLS.service.police;
  if (type.includes('ems')) return MARKER_SYMBOLS.service.ems;
  return MARKER_SYMBOLS.service.default;
};
