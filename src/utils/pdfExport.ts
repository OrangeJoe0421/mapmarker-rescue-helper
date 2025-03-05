
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { EmergencyService, CustomMarker, Route, UserLocation } from '@/types/mapTypes';

export interface ExportData {
  userLocation: UserLocation | null;
  emergencyServices: EmergencyService[];
  customMarkers: CustomMarker[];
  routes: Route[];
}

export const exportToPdf = (data: ExportData) => {
  const { userLocation, emergencyServices, customMarkers, routes } = data;
  
  // Create a new PDF document
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Add title
  doc.setFontSize(20);
  doc.text('Emergency Response Plan', pageWidth / 2, 15, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth / 2, 22, { align: 'center' });
  
  let yPosition = 30;
  
  // Add user location section
  doc.setFontSize(16);
  doc.text('User Location', 14, yPosition);
  yPosition += 8;
  
  if (userLocation) {
    const userLocationData = [
      ['Latitude', userLocation.latitude.toFixed(6)],
      ['Longitude', userLocation.longitude.toFixed(6)]
    ];
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Property', 'Value']],
      body: userLocationData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      margin: { left: 14, right: 14 }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 10;
  } else {
    doc.setFontSize(12);
    doc.text('No user location set', 14, yPosition);
    yPosition += 10;
  }
  
  // Add emergency services section
  doc.setFontSize(16);
  doc.text('Emergency Services', 14, yPosition);
  yPosition += 8;
  
  if (emergencyServices.length > 0) {
    const emergencyServicesData = emergencyServices.map(service => [
      service.name,
      service.type,
      service.road_distance ? `${service.road_distance.toFixed(2)} km` : 'N/A',
      service.verification?.hasEmergencyRoom ? 'Yes' : 'No'
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Name', 'Type', 'Distance', 'ER Available']],
      body: emergencyServicesData,
      theme: 'grid',
      headStyles: { fillColor: [192, 57, 43], textColor: 255 },
      margin: { left: 14, right: 14 }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 10;
  } else {
    doc.setFontSize(12);
    doc.text('No emergency services found', 14, yPosition);
    yPosition += 10;
  }
  
  // Check if we need a new page
  if (yPosition > 230) {
    doc.addPage();
    yPosition = 20;
  }
  
  // Add custom markers section
  doc.setFontSize(16);
  doc.text('Custom Markers', 14, yPosition);
  yPosition += 8;
  
  if (customMarkers.length > 0) {
    // Create rows for the main marker data
    const customMarkersData = customMarkers.map(marker => {
      const row = [
        marker.name,
        marker.latitude.toFixed(6),
        marker.longitude.toFixed(6),
        new Date(marker.createdAt).toLocaleString()
      ];
      
      return row;
    });
    
    // Create the main table
    autoTable(doc, {
      startY: yPosition,
      head: [['Name', 'Latitude', 'Longitude', 'Created At']],
      body: customMarkersData,
      theme: 'grid',
      headStyles: { fillColor: [39, 174, 96], textColor: 255 },
      margin: { left: 14, right: 14 }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 10;
    
    // Add metadata tables for markers that have metadata
    const markersWithMetadata = customMarkers.filter(
      marker => marker.metadata && Object.keys(marker.metadata).length > 0
    );
    
    if (markersWithMetadata.length > 0) {
      doc.setFontSize(14);
      doc.text('Marker Metadata', 14, yPosition);
      yPosition += 8;
      
      for (const marker of markersWithMetadata) {
        if (!marker.metadata) continue;
        
        const metadataRows = [];
        
        if (marker.metadata.projectNumber) {
          metadataRows.push(['Project Number', marker.metadata.projectNumber]);
        }
        
        if (marker.metadata.region) {
          metadataRows.push(['Region', marker.metadata.region]);
        }
        
        if (marker.metadata.projectType) {
          metadataRows.push(['Project Type', marker.metadata.projectType]);
        }
        
        if (metadataRows.length > 0) {
          // Check if we need a new page
          if (yPosition > 230) {
            doc.addPage();
            yPosition = 20;
          }
          
          doc.setFontSize(12);
          doc.text(`Metadata for: ${marker.name}`, 14, yPosition);
          yPosition += 6;
          
          autoTable(doc, {
            startY: yPosition,
            head: [['Field', 'Value']],
            body: metadataRows,
            theme: 'grid',
            headStyles: { fillColor: [46, 204, 113], textColor: 255 },
            margin: { left: 14, right: 14 }
          });
          
          yPosition = (doc as any).lastAutoTable.finalY + 10;
        }
      }
    }
  } else {
    doc.setFontSize(12);
    doc.text('No custom markers added', 14, yPosition);
    yPosition += 10;
  }
  
  // Check if we need a new page
  if (yPosition > 230) {
    doc.addPage();
    yPosition = 20;
  }
  
  // Add routes section
  doc.setFontSize(16);
  doc.text('Routes', 14, yPosition);
  yPosition += 8;
  
  if (routes.length > 0) {
    const routesData = routes.map(route => {
      const fromMarker = customMarkers.find(m => m.id === route.fromId);
      const fromLabel = fromMarker ? fromMarker.name : 'Unknown';
      const toLabel = route.toId ? 
        customMarkers.find(m => m.id === route.toId)?.name || 'Unknown' : 
        'User Location';
      
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
  } else {
    doc.setFontSize(12);
    doc.text('No routes calculated', 14, yPosition);
  }
  
  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
  }
  
  // Save the PDF
  doc.save('emergency-response-plan.pdf');
};
