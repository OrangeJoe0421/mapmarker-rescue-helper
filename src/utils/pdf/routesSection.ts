
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Route, CustomMarker, EmergencyService, UserLocation } from '@/types/mapTypes';

export const addRoutesSection = (
  doc: jsPDF,
  routes: Route[],
  customMarkers: CustomMarker[],
  emergencyServices: EmergencyService[],
  userLocation: UserLocation | null,
  yPosition: number
): number => {
  doc.setFontSize(16);
  doc.text('Routes', 14, yPosition);
  yPosition += 8;
  
  if (routes.length > 0) {
    // Basic routes summary table
    const routesData = routes.map(route => {
      // Find the source marker (could be emergency service or custom marker)
      let fromMarker: any = customMarkers.find(m => m.id === route.fromId);
      
      if (!fromMarker) {
        fromMarker = emergencyServices.find(s => s.id === route.fromId);
      }
      
      const fromLabel = fromMarker ? fromMarker.name : 'Unknown';
      const toLabel = route.toId ? 
        customMarkers.find(m => m.id === route.toId)?.name || 'Unknown' : 
        'Project Location';
      
      return [
        fromLabel,
        toLabel,
        `${route.distance.toFixed(2)} km`,
        route.duration ? `${Math.ceil(route.duration)} min` : 'N/A'
      ];
    });
    
    autoTable(doc, {
      startY: yPosition,
      head: [['From', 'To', 'Distance', 'Est. Duration']],
      body: routesData,
      theme: 'grid',
      headStyles: { fillColor: [142, 68, 173], textColor: 255 },
      margin: { left: 14, right: 14 }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 10;
  } else {
    doc.setFontSize(12);
    doc.text('No routes calculated', 14, yPosition);
    yPosition += 10;
  }
  
  return yPosition;
};

export const addDetailedRouteInformation = (
  doc: jsPDF,
  routes: Route[],
  customMarkers: CustomMarker[],
  emergencyServices: EmergencyService[],
  userLocation: UserLocation | null,
  pageWidth: number
): void => {
  // Add detailed route information on a new page
  doc.addPage();
  doc.setFontSize(16);
  doc.text('Detailed Route Information', pageWidth / 2, 15, { align: 'center' });
  let yPosition = 30;
  
  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    
    // Find from and to information
    let fromEntity: any = customMarkers.find(m => m.id === route.fromId);
    if (!fromEntity) {
      fromEntity = emergencyServices.find(s => s.id === route.fromId);
    }
    
    let toEntity: any = null;
    let toName = 'Project Location';
    
    if (route.toId) {
      toEntity = customMarkers.find(m => m.id === route.toId);
      if (toEntity) {
        toName = toEntity.name;
      }
    } else if (userLocation) {
      toEntity = userLocation;
    }
    
    const fromName = fromEntity ? fromEntity.name : 'Unknown';
    
    doc.setFontSize(14);
    doc.text(`Route ${i + 1}: ${fromName} to ${toName}`, 14, yPosition);
    yPosition += 8;
    
    // Route summary
    const routeDetails = [
      ['Starting Point', fromName],
      ['Destination', toName],
      ['Total Distance', `${route.distance.toFixed(2)} km`],
      ['Estimated Duration', route.duration ? `${Math.ceil(route.duration)} min` : 'N/A'],
      ['Average Speed', `${(route.distance / (route.duration ? route.duration / 60 : 0.5)).toFixed(1)} km/h`],
    ];
    
    if (fromEntity) {
      if (fromEntity.address) {
        routeDetails.push(['Starting Address', fromEntity.address]);
      }
      if (fromEntity.phone) {
        routeDetails.push(['Starting Point Contact', fromEntity.phone]);
      }
    }
    
    if (toEntity && 'address' in toEntity) {
      routeDetails.push(['Destination Address', toEntity.address]);
    }
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Property', 'Value']],
      body: routeDetails,
      theme: 'grid',
      headStyles: { fillColor: [155, 89, 182], textColor: 255 },
      margin: { left: 14, right: 14 }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 10;
    
    // Add written driving instructions if available
    doc.setFontSize(12);
    doc.text('Driving Instructions:', 14, yPosition);
    yPosition += 6;
    
    // Generate simplified driving instructions based on the route points
    if (route.points.length > 1) {
      const instructions = generateRouteInstructions(route, fromName, toName);
      
      autoTable(doc, {
        startY: yPosition,
        head: [['Step', 'Instruction']],
        body: instructions.map((instruction, index) => [
          (index + 1).toString(),
          instruction
        ]),
        theme: 'grid',
        headStyles: { fillColor: [155, 89, 182], textColor: 255 },
        styles: { overflow: 'linebreak', cellWidth: 'auto' },
        columnStyles: { 0: { cellWidth: 30 } },
        margin: { left: 14, right: 14 }
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 15;
    } else {
      doc.text('Detailed instructions not available for this route.', 14, yPosition);
      yPosition += 10;
    }
    
    // Add a page break if we're running out of space and there are more routes
    if (i < routes.length - 1 && yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }
  }
};

/**
 * Generate simplified route instructions based on route points
 */
function generateRouteInstructions(
  route: Route,
  startName: string,
  endName: string
): string[] {
  const instructions: string[] = [];
  
  if (route.points.length < 2) {
    return ["Route information not available."];
  }
  
  // Starting instruction
  instructions.push(`Start from ${startName}.`);
  
  // If we have many points, we can create more detailed instructions
  if (route.points.length > 3) {
    // Calculate approximate headings between points to determine direction changes
    const segments = calculateRouteSegments(route.points);
    
    // Generate instructions for each significant direction change
    let currentDirection = "";
    let distanceSinceLastInstruction = 0;
    let segmentCount = 0;
    
    segments.forEach((segment, index) => {
      // First segment is the initial direction
      if (index === 0) {
        instructions.push(`Head ${segment.direction} for approximately ${segment.distance.toFixed(1)} km.`);
        currentDirection = segment.direction;
        segmentCount = 1;
        distanceSinceLastInstruction = segment.distance;
      } else {
        // If direction changes significantly, add a new instruction
        if (segment.direction !== currentDirection) {
          if (segment.turnType) {
            instructions.push(
              `Continue ${currentDirection} for ${distanceSinceLastInstruction.toFixed(1)} km, then ${segment.turnType} onto the road heading ${segment.direction}.`
            );
          } else {
            instructions.push(
              `After ${distanceSinceLastInstruction.toFixed(1)} km, continue ${segment.direction}.`
            );
          }
          currentDirection = segment.direction;
          distanceSinceLastInstruction = segment.distance;
          segmentCount = 1;
        } else {
          // If same direction, accumulate distance
          distanceSinceLastInstruction += segment.distance;
          segmentCount++;
          
          // Add an instruction every few segments to avoid long silence
          if (segmentCount >= 3 && distanceSinceLastInstruction > 1) {
            instructions.push(`Continue ${currentDirection} for ${distanceSinceLastInstruction.toFixed(1)} km.`);
            distanceSinceLastInstruction = 0;
            segmentCount = 0;
          }
        }
      }
    });
    
    // If we have accumulated distance without instruction, add a final one
    if (distanceSinceLastInstruction > 0) {
      instructions.push(`Continue ${currentDirection} for ${distanceSinceLastInstruction.toFixed(1)} km.`);
    }
  } else {
    // For simple routes with few points, provide a basic instruction
    instructions.push(`Travel ${route.distance.toFixed(1)} km to reach your destination.`);
  }
  
  // Final instruction
  instructions.push(`Arrive at ${endName}. Total distance: ${route.distance.toFixed(1)} km.`);
  
  return instructions;
}

/**
 * Calculate segments between route points with directions and turn types
 */
interface RouteSegment {
  distance: number;
  direction: string;
  turnType?: string;
}

function calculateRouteSegments(points: { latitude: number; longitude: number }[]): RouteSegment[] {
  const segments: RouteSegment[] = [];
  
  for (let i = 0; i < points.length - 1; i++) {
    const currentPoint = points[i];
    const nextPoint = points[i + 1];
    
    // Calculate distance between points
    const distance = calculateDistance(
      currentPoint.latitude,
      currentPoint.longitude,
      nextPoint.latitude,
      nextPoint.longitude
    );
    
    // Calculate heading (bearing) between points
    const heading = calculateHeading(
      currentPoint.latitude,
      currentPoint.longitude,
      nextPoint.latitude,
      nextPoint.longitude
    );
    
    // Convert heading to cardinal direction
    const direction = headingToDirection(heading);
    
    // Determine turn type if not the first segment
    let turnType: string | undefined;
    
    if (i > 0 && segments.length > 0) {
      const prevHeading = calculateHeading(
        points[i-1].latitude,
        points[i-1].longitude,
        currentPoint.latitude,
        currentPoint.longitude
      );
      
      const headingDiff = calculateHeadingDifference(prevHeading, heading);
      turnType = getTurnType(headingDiff);
    }
    
    segments.push({
      distance,
      direction,
      turnType
    });
  }
  
  return segments;
}

/**
 * Calculate the distance between two points using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in km
  return distance;
}

/**
 * Calculate heading (bearing) between two points
 */
function calculateHeading(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  const lonDiffRad = (lon2 - lon1) * Math.PI / 180;
  
  const y = Math.sin(lonDiffRad) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
          Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(lonDiffRad);
  
  let bearing = Math.atan2(y, x) * 180 / Math.PI;
  bearing = (bearing + 360) % 360; // Normalize to 0-360
  
  return bearing;
}

/**
 * Convert heading in degrees to cardinal direction
 */
function headingToDirection(heading: number): string {
  const directions = ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"];
  const index = Math.round(heading / 45) % 8;
  return directions[index];
}

/**
 * Calculate the difference between two headings, accounting for 360 degree wrap
 */
function calculateHeadingDifference(heading1: number, heading2: number): number {
  let diff = Math.abs(heading2 - heading1);
  if (diff > 180) {
    diff = 360 - diff;
  }
  return diff;
}

/**
 * Get turn type based on heading difference
 */
function getTurnType(headingDiff: number): string {
  if (headingDiff < 10) {
    return "continue straight";
  } else if (headingDiff < 45) {
    return "slight turn";
  } else if (headingDiff < 135) {
    return "turn";
  } else {
    return "make a U-turn";
  }
}
