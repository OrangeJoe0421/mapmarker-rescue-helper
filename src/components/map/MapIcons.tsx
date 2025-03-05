
import { Icon } from 'leaflet';

// User location icon
export const userIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="#38a169" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="8" r="5" />
      <path d="M20 21a8 8 0 1 0-16 0" />
    </svg>
  `),
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
  className: 'pulse-animation',
});

// Hospital icon
export const hospitalIcon = new Icon({
  iconUrl: '/hospital-marker.svg',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
});

// EMS icon
export const emsIcon = new Icon({
  iconUrl: '/ems-marker.svg',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
});

// Fire station icon
export const fireIcon = new Icon({
  iconUrl: '/fire-marker.svg',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
});

// Law enforcement icon
export const lawIcon = new Icon({
  iconUrl: '/law-marker.svg',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
});

// Custom marker icon
export const customIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="#3B82F6" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  `),
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

// Helper function to determine which icon to use based on service type
export const getServiceIcon = (service: any) => {
  const type = service.type.toLowerCase();
  if (type.includes('hospital')) return hospitalIcon;
  if (type.includes('ems') || type.includes('ambulance')) return emsIcon;
  if (type.includes('fire')) return fireIcon;
  if (type.includes('law') || type.includes('police')) return lawIcon;
  return hospitalIcon; // Default to hospital icon
};
