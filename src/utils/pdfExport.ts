
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { EmergencyService, CustomMarker, Route, UserLocation } from '@/types/mapTypes';
import html2canvas from 'html2canvas';

export interface ExportData {
  userLocation: UserLocation | null;
  emergencyServices: EmergencyService[];
  customMarkers: CustomMarker[];
  routes: Route[];
}

export const exportToPdf = async (data: ExportData) => {
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
    // Create location data, including metadata if available
    const userLocationData = [
      ['Latitude', userLocation.latitude.toFixed(6)],
      ['Longitude', userLocation.longitude.toFixed(6)]
    ];
    
    // Add metadata fields if they exist
    if (userLocation.metadata) {
      if (userLocation.metadata.projectNumber) {
        userLocationData.push(['Project Number', userLocation.metadata.projectNumber]);
      }
      if (userLocation.metadata.region) {
        userLocationData.push(['Region', userLocation.metadata.region]);
      }
      if (userLocation.metadata.projectType) {
        userLocationData.push(['Project Type', userLocation.metadata.projectType]);
      }
    }
    
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
  
  // Add emergency services section with enhanced details
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
    
    // Add detailed services information
    doc.setFontSize(14);
    doc.text('Emergency Services Details', 14, yPosition);
    yPosition += 8;
    
    for (const service of emergencyServices) {
      // Check if we need a new page
      if (yPosition > 230) {
        doc.addPage();
        yPosition = 20;
      }
      
      const detailsData = [
        ['Name', service.name],
        ['Type', service.type],
        ['Address', service.address || 'N/A'],
        ['Phone', service.phone || 'N/A'],
        ['Hours', service.hours || 'N/A'],
        ['ER Available', service.verification?.hasEmergencyRoom ? 'Yes' : 'No']
      ];
      
      if (service.road_distance) {
        detailsData.push(['Distance from User', `${service.road_distance.toFixed(2)} km`]);
      }
      
      autoTable(doc, {
        startY: yPosition,
        head: [[`Service Details: ${service.name}`]],
        body: detailsData,
        theme: 'grid',
        headStyles: { fillColor: [231, 76, 60], textColor: 255 },
        margin: { left: 14, right: 14 }
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }
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
  
  // Add enhanced routes section with detailed routing information
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
    
    yPosition = (doc as any).lastAutoTable.finalY + 10;
    
    // Add detailed route information on a new page
    doc.addPage();
    doc.setFontSize(16);
    doc.text('Detailed Route Information', pageWidth / 2, 15, { align: 'center' });
    yPosition = 30;
    
    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];
      
      // Find from and to information
      let fromEntity: any = customMarkers.find(m => m.id === route.fromId);
      if (!fromEntity) {
        fromEntity = emergencyServices.find(s => s.id === route.fromId);
      }
      
      let toEntity: any = null;
      let toName = 'User Location';
      
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
  } else {
    doc.setFontSize(12);
    doc.text('No routes calculated', 14, yPosition);
  }
  
  // Capture map image and add to PDF
  try {
    const mapElement = document.querySelector('.leaflet-container') as HTMLElement;
    if (mapElement) {
      // Add a new page for the map
      doc.addPage();
      
      doc.setFontSize(16);
      doc.text('Map View', pageWidth / 2, 15, { align: 'center' });
      
      // Use html2canvas to capture the map as an image
      const canvas = await html2canvas(mapElement, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
      });
      
      // Calculate dimensions to fit on the page while maintaining aspect ratio
      const imgWidth = pageWidth - 20; // Margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add the map image to the PDF
      const imgData = canvas.toDataURL('image/png');
      doc.addImage(imgData, 'PNG', 10, 25, imgWidth, imgHeight);
    }
  } catch (error) {
    console.error('Error capturing map:', error);
    // Add a page with an error message if map capture fails
    doc.addPage();
    doc.setFontSize(16);
    doc.text('Map View', pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text('Error generating map image', pageWidth / 2, 40, { align: 'center' });
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
