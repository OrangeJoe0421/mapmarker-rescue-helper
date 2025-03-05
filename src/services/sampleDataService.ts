
import { EmergencyService } from '../types/mapTypes';

// Sample EMS data for Los Angeles area with realistic coordinates
const sampleEmsData: EmergencyService[] = [
  // Hospitals
  {
    id: "hosp-001",
    name: "Cedars-Sinai Medical Center",
    type: "Hospital",
    latitude: 34.0750,
    longitude: -118.3803,
    verification: {
      hasEmergencyRoom: true,
      verifiedAt: new Date("2023-11-15T09:24:00")
    }
  },
  {
    id: "hosp-002",
    name: "Ronald Reagan UCLA Medical Center",
    type: "Hospital",
    latitude: 34.0665,
    longitude: -118.4443,
    verification: {
      hasEmergencyRoom: true,
      verifiedAt: new Date("2023-10-20T14:30:00")
    }
  },
  {
    id: "hosp-003",
    name: "LAC+USC Medical Center",
    type: "Hospital",
    latitude: 34.0582,
    longitude: -118.2097,
    verification: {
      hasEmergencyRoom: true,
      verifiedAt: new Date("2023-12-05T11:15:00")
    }
  },
  {
    id: "hosp-004",
    name: "Hollywood Presbyterian Medical Center",
    type: "Hospital",
    latitude: 34.0905,
    longitude: -118.3102,
    verification: undefined
  },
  {
    id: "hosp-005",
    name: "Kaiser Permanente Los Angeles Medical Center",
    type: "Hospital",
    latitude: 34.0730,
    longitude: -118.2942,
    verification: undefined
  },
  
  // EMS Stations
  {
    id: "ems-001",
    name: "Los Angeles Fire Department Station 27",
    type: "EMS Station",
    latitude: 34.0983,
    longitude: -118.3258,
    verification: undefined
  },
  {
    id: "ems-002",
    name: "LAFD Ambulance Station 11",
    type: "EMS Station",
    latitude: 34.0455,
    longitude: -118.2520,
    verification: undefined
  },
  {
    id: "ems-003",
    name: "Emergency Medical Service Center - Downtown",
    type: "EMS Station",
    latitude: 34.0407,
    longitude: -118.2468,
    verification: undefined
  },
  
  // Fire Stations
  {
    id: "fire-001",
    name: "LAFD Station 3 - Downtown",
    type: "Fire Station",
    latitude: 34.0560,
    longitude: -118.2548,
    verification: undefined
  },
  {
    id: "fire-002",
    name: "LAFD Station 9 - Skid Row",
    type: "Fire Station",
    latitude: 34.0434,
    longitude: -118.2400,
    verification: undefined
  },
  {
    id: "fire-003",
    name: "LAFD Station 27 - Hollywood",
    type: "Fire Station",
    latitude: 34.0983,
    longitude: -118.3258,
    verification: undefined
  },
  {
    id: "fire-004",
    name: "LAFD Station 82 - Hollywood Hills",
    type: "Fire Station",
    latitude: 34.1155,
    longitude: -118.3666,
    verification: undefined
  },
  
  // Law Enforcement
  {
    id: "law-001",
    name: "LAPD Hollywood Division",
    type: "Law Enforcement",
    latitude: 34.0986,
    longitude: -118.3324,
    verification: undefined
  },
  {
    id: "law-002",
    name: "LAPD Central Division",
    type: "Law Enforcement",
    latitude: 34.0510,
    longitude: -118.2468,
    verification: undefined
  },
  {
    id: "law-003",
    name: "LAPD West LA Division",
    type: "Law Enforcement",
    latitude: 34.0406,
    longitude: -118.4292,
    verification: undefined
  },
  {
    id: "law-004",
    name: "LAPD Wilshire Division",
    type: "Law Enforcement",
    latitude: 34.0715,
    longitude: -118.3315,
    verification: undefined
  },
  {
    id: "law-005",
    name: "LAPD Olympic Division",
    type: "Law Enforcement",
    latitude: 34.0572,
    longitude: -118.2922,
    verification: undefined
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
