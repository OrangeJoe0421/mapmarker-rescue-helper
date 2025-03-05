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
  
  // Add project location section (renamed from user location)
  doc.setFontSize(16);
  doc.text('Project Location', 14, yPosition);
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
    doc.text('No project location set', 14, yPosition);
    yPosition += 10;
  }
  
  // Add emergency services section (basic table only - detailed section removed)
  doc.setFontSize(16);
  doc.text('Emergency Services', 14, yPosition);
  yPosition += 8;
  
  if (emergencyServices.length > 0) {
    const emergencyServicesData = emergencyServices.map(service => [
      service.name,
      service.type,
      service.road_distance ? `${service.road_distance.toFixed(2)} km` : 'N/A',
      service.verification?.hasEmergencyRoom ? 'Yes' : 'No',
      service.phone || 'N/A',
      service.address || 'N/A',
      service.hours || 'N/A'
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Name', 'Type', 'Distance', 'ER Available', 'Phone', 'Address', 'Hours']],
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
  
  // Add routes section (keeping this section, as it contains routing information)
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
        'Project Location'; // Changed from 'User Location'
      
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
      let toName = 'Project Location'; // Changed from 'User Location'
      
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
  
  // Capture map image and add to PDF (updated to ensure route lines are visible)
  try {
    const mapElement = document.querySelector('.leaflet-container') as HTMLElement;
    if (mapElement) {
      // Add a new page for the map
      doc.addPage();
      
      doc.setFontSize(16);
      doc.text('Map View with Routes', pageWidth / 2, 15, { align: 'center' });
      
      // Wait a small moment to ensure all map elements are rendered
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Use html2canvas to capture the map as an image with routes
      const canvas = await html2canvas(mapElement, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        scale: 2, // Higher resolution
        logging: true,
        onclone: (document, element) => {
          // This ensures that all map layers (including routes) are visible in the cloned document
          const routes = element.querySelectorAll('.leaflet-overlay-pane');
          routes.forEach(route => {
            if (route instanceof HTMLElement) {
              route.style.display = 'block';
              route.style.visibility = 'visible';
              route.style.opacity = '1';
            }
          });
        }
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
