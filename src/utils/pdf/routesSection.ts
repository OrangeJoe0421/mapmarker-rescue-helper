
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
  // Dark header with white text
  doc.setFillColor(51, 51, 51, 0.8); // Dark gray with opacity
  doc.rect(10, yPosition - 5, doc.internal.pageSize.getWidth() - 20, 10, 'F'); // Section header
  doc.setTextColor(255, 255, 255); // White text
  doc.setFontSize(14);
  doc.text('Routes', 14, yPosition);
  yPosition += 10;
  
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
    
    // Clean table styling with white header text
    autoTable(doc, {
      startY: yPosition,
      head: [['From', 'To', 'Distance', 'Est. Duration']],
      body: routesData,
      theme: 'plain',
      headStyles: { 
        fillColor: [51, 51, 51] as any, // Dark background for header
        textColor: [255, 255, 255] as any, // White text for header
        fontStyle: 'bold',
        cellPadding: 4
      },
      alternateRowStyles: {
        fillColor: [255, 255, 255] as any // White background
      },
      margin: { left: 14, right: 14 },
      styles: {
        fontSize: 9,
        cellPadding: 4,
        lineColor: [220, 220, 220] as any, // Lighter grid lines
        lineWidth: 0.1 // Thinner lines for a cleaner look
      }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 10;
  } else {
    doc.setFontSize(12);
    doc.setTextColor(51, 51, 51); // Reset to dark gray for body text
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
  // Dark header with white text for main header
  doc.addPage();
  doc.setFillColor(51, 51, 51, 0.8); // Dark gray with opacity
  doc.rect(10, 10, doc.internal.pageSize.getWidth() - 20, 10, 'F'); // Section header
  doc.setTextColor(255, 255, 255); // White text
  doc.setFontSize(16);
  doc.text('Hospital Route Information', pageWidth / 2, 15, { align: 'center' });
  let yPosition = 30;
  
  // Filter to only include hospital routes
  const hospitalRoutes = routes.filter(route => {
    const fromEntity = emergencyServices.find(s => s.id === route.fromId);
    return fromEntity && 
      'type' in fromEntity && 
      typeof fromEntity.type === 'string' && 
      (fromEntity.type.toLowerCase().includes('hospital') || 
       fromEntity.type.toLowerCase().includes('medical center'));
  });
  
  if (hospitalRoutes.length === 0) {
    doc.setTextColor(51, 51, 51); // Dark gray text
    doc.setFontSize(12);
    doc.text('No hospital routes available', 14, yPosition);
    yPosition += 20;
  } else {
    for (let i = 0; i < hospitalRoutes.length; i++) {
      const route = hospitalRoutes[i];
      
      // Find from and to information
      const fromEntity = emergencyServices.find(s => s.id === route.fromId);
      
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
      doc.setTextColor(51, 51, 51); // Dark gray text
      doc.text(`Route to ${fromName}`, 14, yPosition);
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
      
      // Clean table styling without background colors
      autoTable(doc, {
        startY: yPosition,
        head: [['Property', 'Value']],
        body: routeDetails,
        theme: 'plain',
        headStyles: { 
          fillColor: [51, 51, 51] as any, // Dark background for header
          textColor: [255, 255, 255] as any, // White text for header
          fontStyle: 'bold',
          cellPadding: 4
        },
        alternateRowStyles: {
          fillColor: [255, 255, 255] as any // White background
        },
        margin: { left: 14, right: 14 },
        styles: {
          fontSize: 9,
          cellPadding: 4,
          lineColor: [220, 220, 220] as any, // Lighter grid lines
          lineWidth: 0.1 // Thinner lines for a cleaner look
        },
        columnStyles: {
          0: { fontStyle: 'bold' },
          1: { halign: 'left' }
        }
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 10;
      
      // Add written driving instructions
      doc.setFontSize(12);
      doc.setTextColor(51, 51, 51); // Dark gray text
      doc.text('Driving Instructions:', 14, yPosition);
      yPosition += 6;
      
      // Generate simplified driving instructions based on the route points
      if (route.points.length > 1) {
        const instructions = generateRouteInstructions(route, fromName, toName);
        
        // Clean table styling with white header text
        autoTable(doc, {
          startY: yPosition,
          head: [['Step', 'Instruction']],
          body: instructions.map((instruction, index) => [
            (index + 1).toString(),
            instruction
          ]),
          theme: 'plain',
          headStyles: { 
            fillColor: [51, 51, 51] as any, // Dark background for header
            textColor: [255, 255, 255] as any, // White text for header
            fontStyle: 'bold',
            cellPadding: 4
          },
          alternateRowStyles: {
            fillColor: [255, 255, 255] as any // White background
          },
          styles: { 
            overflow: 'linebreak', 
            cellWidth: 'auto',
            fontSize: 9,
            cellPadding: 4,
            lineColor: [220, 220, 220] as any, // Lighter grid lines
            lineWidth: 0.1 // Thinner lines for a cleaner look
          },
          columnStyles: { 0: { cellWidth: 30 } },
          margin: { left: 14, right: 14 }
        });
        
        yPosition = (doc as any).lastAutoTable.finalY + 15;
      } else {
        doc.text('Detailed instructions not available for this route.', 14, yPosition);
        yPosition += 10;
      }
      
      // Add a page break if we're running out of space and there are more routes
      if (i < hospitalRoutes.length - 1 && yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }
    }
  }
  
  // Add the Service Details section
  addServiceDetailsSection(doc, emergencyServices, pageWidth);
};

export const addServiceDetailsSection = (
  doc: jsPDF,
  emergencyServices: EmergencyService[],
  pageWidth: number
): void => {
  doc.addPage();
  doc.setFillColor(51, 51, 51, 0.8); // Dark gray with opacity
  doc.rect(10, 10, doc.internal.pageSize.getWidth() - 20, 10, 'F'); // Section header
  doc.setTextColor(255, 255, 255); // White text
  doc.setFontSize(16);
  doc.text('Service Details', pageWidth / 2, 15, { align: 'center' });
  
  let yPosition = 30;
  
  if (emergencyServices.length === 0) {
    doc.setTextColor(51, 51, 51); // Dark gray text
    doc.setFontSize(12);
    doc.text('No emergency services available', 14, yPosition);
    return;
  }
  
  // Group services by type for better organization
  const serviceTypes = [...new Set(emergencyServices.map(service => 
    service.type.toLowerCase().includes('hospital') ? 'Hospital' :
    service.type.toLowerCase().includes('fire') ? 'Fire Department' :
    service.type.toLowerCase().includes('police') || service.type.toLowerCase().includes('law') ? 'Law Enforcement' :
    service.type.toLowerCase().includes('ems') ? 'EMS' : 'Other'
  ))];
  
  for (const type of serviceTypes) {
    // Filter services by current type
    const typeServices = emergencyServices.filter(service => {
      const serviceType = service.type.toLowerCase();
      return (
        (type === 'Hospital' && serviceType.includes('hospital')) ||
        (type === 'Fire Department' && serviceType.includes('fire')) ||
        (type === 'Law Enforcement' && (serviceType.includes('police') || serviceType.includes('law'))) ||
        (type === 'EMS' && serviceType.includes('ems')) ||
        (type === 'Other' && !serviceType.includes('hospital') && !serviceType.includes('fire') && 
         !serviceType.includes('police') && !serviceType.includes('law') && !serviceType.includes('ems'))
      );
    });
    
    if (typeServices.length === 0) continue;
    
    // Section header for each type
    doc.setFillColor(51, 51, 51, 0.8); // Dark gray with opacity
    doc.rect(10, yPosition - 5, doc.internal.pageSize.getWidth() - 20, 10, 'F');
    doc.setTextColor(255, 255, 255); // White text
    doc.setFontSize(14);
    doc.text(type, 14, yPosition);
    yPosition += 10;
    
    for (const service of typeServices) {
      // Create a card-like section for each service
      doc.setFillColor(245, 245, 245, 0.5); // Very light gray background
      doc.rect(14, yPosition, pageWidth - 28, 60, 'F');
      
      // Service name
      doc.setTextColor(51, 51, 51); // Dark gray text
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(service.name, 20, yPosition + 10);
      
      // Service type
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(service.type, 20, yPosition + 20);
      
      // Details in two columns
      const leftColumn = 20;
      const rightColumn = pageWidth / 2;
      let detailsY = yPosition + 30;
      
      // Left column
      if (service.address) {
        doc.setFontSize(9);
        doc.text('Address:', leftColumn, detailsY);
        doc.text(service.address, leftColumn + 35, detailsY);
        detailsY += 8;
      }
      
      if (service.phone) {
        doc.setFontSize(9);
        doc.text('Phone:', leftColumn, detailsY);
        doc.text(service.phone, leftColumn + 35, detailsY);
        detailsY += 8;
      }
      
      // Right column
      detailsY = yPosition + 30;
      
      if (service.hours) {
        doc.setFontSize(9);
        doc.text('Hours:', rightColumn, detailsY);
        doc.text(service.hours, rightColumn + 35, detailsY);
        detailsY += 8;
      }
      
      if (service.road_distance !== undefined) {
        doc.setFontSize(9);
        doc.text('Distance:', rightColumn, detailsY);
        doc.text(`${service.road_distance.toFixed(2)} km from project`, rightColumn + 35, detailsY);
        detailsY += 8;
      }
      
      // For hospitals, add emergency room verification
      if (service.type.toLowerCase().includes('hospital')) {
        const hasER = service.verification?.hasEmergencyRoom;
        const erStatus = hasER ? 'Yes - Verified' : 'Not verified';
        
        doc.setFontSize(9);
        doc.text('Emergency Room:', leftColumn, detailsY);
        doc.text(erStatus, leftColumn + 35, detailsY);
      }
      
      yPosition += 70; // Move to next service with spacing
      
      // Add page break if needed
      if (yPosition > doc.internal.pageSize.getHeight() - 60) {
        doc.addPage();
        yPosition = 20;
      }
    }
    
    yPosition += 10; // Add space after each service type group
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
