
import { EmergencyService } from '../types/mapTypes';

// Sample EMS data with more realistic information
const sampleEmsData: EmergencyService[] = [
  {
    id: "hosp-001",
    name: "Memorial General Hospital",
    type: "Hospital",
    latitude: 37.7749,
    longitude: -122.4194,
    verification: undefined
  },
  {
    id: "hosp-002",
    name: "St. Mary's Medical Center",
    type: "Hospital",
    latitude: 37.7833,
    longitude: -122.4167,
    verification: undefined
  },
  {
    id: "ems-001",
    name: "Downtown EMS Station",
    type: "EMS Station",
    latitude: 37.7833,
    longitude: -122.4294,
    verification: undefined
  },
  {
    id: "clin-001",
    name: "Bayside Urgent Care",
    type: "Urgent Care",
    latitude: 37.7925,
    longitude: -122.4148,
    verification: undefined
  },
  {
    id: "fire-001",
    name: "Station 1 Fire Department",
    type: "Fire Station",
    latitude: 37.7749,
    longitude: -122.4300,
    verification: undefined
  },
  {
    id: "hosp-003",
    name: "University Medical Center",
    type: "Hospital",
    latitude: 37.7694,
    longitude: -122.4270,
    verification: {
      hasEmergencyRoom: true,
      verifiedAt: new Date("2023-05-15T09:24:00")
    }
  },
  {
    id: "clin-002",
    name: "Marina Health Clinic",
    type: "Clinic",
    latitude: 37.8036,
    longitude: -122.4368,
    verification: {
      hasEmergencyRoom: false,
      verifiedAt: new Date("2023-06-20T14:30:00")
    }
  }
];

// Function to get all EMS data
export const getAllEmsData = (): EmergencyService[] => {
  return [...sampleEmsData];
};

// Function to get EMS data by ID
export const getEmsDataById = (id: string): EmergencyService | undefined => {
  return sampleEmsData.find(service => service.id === id);
};

// Function to get EMS data filtered by type
export const getEmsDataByType = (type: string): EmergencyService[] => {
  return sampleEmsData.filter(service => service.type.toLowerCase() === type.toLowerCase());
};

// Function to get EMS data within a certain radius (km) using Haversine distance
export const getEmsDataWithinRadius = (lat: number, lng: number, radiusKm: number): EmergencyService[] => {
  return sampleEmsData.filter(service => {
    const distance = calculateHaversineDistance(lat, lng, service.latitude, service.longitude);
    return distance <= radiusKm;
  });
};

// Haversine formula to calculate distance between two coordinates
const calculateHaversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return parseFloat(distance.toFixed(2));
};

const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};
