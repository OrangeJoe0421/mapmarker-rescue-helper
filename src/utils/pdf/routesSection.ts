
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Route, CustomMarker, EmergencyService, UserLocation } from '@/types/mapTypes';

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
      // Create a card-like section for each service with a very light background
      doc.setFillColor(250, 250, 250, 1); // Ultra-light gray background
      doc.rect(14, yPosition, pageWidth - 28, 60, 'F');
      
      // Service name
      doc.setTextColor(51, 51, 51); // Dark gray text for all text elements
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
