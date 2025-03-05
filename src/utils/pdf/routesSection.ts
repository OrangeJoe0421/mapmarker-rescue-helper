
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
    
    yPosition = (doc as any).lastAutoTable.finalY + 15;
    
    if (i < routes.length - 1 && yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }
  }
};
