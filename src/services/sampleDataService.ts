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
    address: "8700 Beverly Blvd, Los Angeles, CA 90048",
    phone: "(310) 423-3277",
    hours: "24/7 Emergency Services",
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
    address: "757 Westwood Plaza, Los Angeles, CA 90095",
    phone: "(310) 825-9111",
    hours: "24/7 Emergency Services",
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
    address: "2051 Marengo St, Los Angeles, CA 90033",
    phone: "(323) 409-1000",
    hours: "24/7 Emergency Services",
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
    address: "1300 N Vermont Ave, Los Angeles, CA 90027",
    phone: "(213) 413-3000",
    hours: "24/7 Emergency Services",
    verification: undefined
  },
  {
    id: "hosp-005",
    name: "Kaiser Permanente Los Angeles Medical Center",
    type: "Hospital",
    latitude: 34.0730,
    longitude: -118.2942,
    address: "4867 Sunset Blvd, Los Angeles, CA 90027",
    phone: "(323) 783-4011",
    hours: "24/7 Emergency Services",
    verification: undefined
  },
  
  // EMS Stations
  {
    id: "ems-001",
    name: "Los Angeles Fire Department Station 27",
    type: "EMS Station",
    latitude: 34.0983,
    longitude: -118.3258,
    address: "1327 N Cole Ave, Los Angeles, CA 90028",
    phone: "(213) 485-6227",
    hours: "24/7 Operations",
    verification: undefined
  },
  {
    id: "ems-002",
    name: "LAFD Ambulance Station 11",
    type: "EMS Station",
    latitude: 34.0455,
    longitude: -118.2520,
    address: "1819 W 7th St, Los Angeles, CA 90057",
    phone: "(213) 485-6211",
    hours: "24/7 Operations",
    verification: undefined
  },
  {
    id: "ems-003",
    name: "Emergency Medical Service Center - Downtown",
    type: "EMS Station",
    latitude: 34.0407,
    longitude: -118.2468,
    address: "510 S Main St, Los Angeles, CA 90013",
    phone: "(213) 485-6003",
    hours: "24/7 Operations",
    verification: undefined
  },
  
  // Fire Stations
  {
    id: "fire-001",
    name: "LAFD Station 3 - Downtown",
    type: "Fire Station",
    latitude: 34.0560,
    longitude: -118.2548,
    address: "108 N Fremont Ave, Los Angeles, CA 90012",
    phone: "(213) 485-6203",
    hours: "24/7 Operations",
    verification: undefined
  },
  {
    id: "fire-002",
    name: "LAFD Station 9 - Skid Row",
    type: "Fire Station",
    latitude: 34.0434,
    longitude: -118.2400,
    address: "430 E 7th St, Los Angeles, CA 90014",
    phone: "(213) 485-6209",
    hours: "24/7 Operations",
    verification: undefined
  },
  {
    id: "fire-003",
    name: "LAFD Station 27 - Hollywood",
    type: "Fire Station",
    latitude: 34.0983,
    longitude: -118.3258,
    address: "1327 N Cole Ave, Los Angeles, CA 90028",
    phone: "(213) 485-6227",
    hours: "24/7 Operations",
    verification: undefined
  },
  {
    id: "fire-004",
    name: "LAFD Station 82 - Hollywood Hills",
    type: "Fire Station",
    latitude: 34.1155,
    longitude: -118.3666,
    address: "1800 N Bronson Ave, Los Angeles, CA 90028",
    phone: "(213) 485-6282",
    hours: "24/7 Operations",
    verification: undefined
  },
  
  // Law Enforcement
  {
    id: "law-001",
    name: "LAPD Hollywood Division",
    type: "Law Enforcement",
    latitude: 34.0986,
    longitude: -118.3324,
    address: "1358 N Wilcox Ave, Los Angeles, CA 90028",
    phone: "(213) 972-2971",
    hours: "24/7 Operations",
    verification: undefined
  },
  {
    id: "law-002",
    name: "LAPD Central Division",
    type: "Law Enforcement",
    latitude: 34.0510,
    longitude: -118.2468,
    address: "251 E 6th St, Los Angeles, CA 90014",
    phone: "(213) 486-6606",
    hours: "24/7 Operations",
    verification: undefined
  },
  {
    id: "law-003",
    name: "LAPD West LA Division",
    type: "Law Enforcement",
    latitude: 34.0406,
    longitude: -118.4292,
    address: "1663 Butler Ave, Los Angeles, CA 90025",
    phone: "(310) 444-0701",
    hours: "24/7 Operations",
    verification: undefined
  },
  {
    id: "law-004",
    name: "LAPD Wilshire Division",
    type: "Law Enforcement",
    latitude: 34.0715,
    longitude: -118.3315,
    address: "4861 Venice Blvd, Los Angeles, CA 90019",
    phone: "(213) 473-0476",
    hours: "24/7 Operations",
    verification: undefined
  },
  {
    id: "law-005",
    name: "LAPD Olympic Division",
    type: "Law Enforcement",
    latitude: 34.0572,
    longitude: -118.2922,
    address: "1130 S Vermont Ave, Los Angeles, CA 90006",
    phone: "(213) 382-9102",
    hours: "24/7 Operations",
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
