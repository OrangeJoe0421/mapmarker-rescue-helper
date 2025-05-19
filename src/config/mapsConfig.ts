
// Centralized Google Maps API configuration
// This ensures consistent settings are used across all components

// Google Maps API key
export const GOOGLE_MAPS_API_KEY = "AIzaSyBYXWPdOpB690ph_f9T2ubD9m4fgEqFUl4";

// Libraries to load - typed correctly for Google Maps API
export const GOOGLE_MAPS_LIBRARIES = ['places', 'geometry'] as const;

// Map loader ID - must be consistent across the application
export const GOOGLE_MAPS_LOADER_ID = 'google-map-script';

// Default map styling for dark theme
export const MAP_STYLES = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#242f3e" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#746855" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#242f3e" }]
  },
  {
    "featureType": "poi",
    "elementType": "all",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "transit",
    "elementType": "all",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#38414e" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#212a37" }]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#9ca5b3" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#17263c" }]
  }
];

export const MAP_OPTIONS = {
  styles: MAP_STYLES,
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true
};
