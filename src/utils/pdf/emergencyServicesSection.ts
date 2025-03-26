
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { EmergencyService } from '@/types/mapTypes';

export const addEmergencyServicesSection = (
  doc: jsPDF,
  emergencyServices: EmergencyService[],
  yPosition: number
): number => {
  // Dark header with white text
  doc.setFillColor(51, 51, 51, 0.8); // Dark gray with opacity
  doc.rect(10, yPosition - 5, doc.internal.pageSize.getWidth() - 20, 10, 'F'); // Section header
  doc.setTextColor(255, 255, 255); // White text
  doc.setFontSize(14);
  doc.text('Emergency Services', 14, yPosition);
  
  yPosition += 10;
  
  if (emergencyServices.length > 0) {
    const emergencyServicesData = emergencyServices.map(service => [
      service.name || 'N/A',
      service.type || 'N/A',
      service.road_distance !== undefined ? `${service.road_distance.toFixed(2)} km` : 'N/A',
      service.verification?.hasEmergencyRoom ? 'Yes' : 'No',
      service.phone || 'N/A',
      service.address || 'N/A',
      service.hours || 'N/A'
    ]);
    
    // Clean table styling with white header text
    autoTable(doc, {
      startY: yPosition,
      head: [['Name', 'Type', 'Distance', 'ER Available', 'Phone', 'Address', 'Hours']],
      body: emergencyServicesData,
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
      margin: { left: 10, right: 10 },
      styles: {
        fontSize: 9,
        cellPadding: 4,
        lineColor: [220, 220, 220] as any, // Lighter grid lines
        lineWidth: 0.1 // Thinner lines for a cleaner look
      },
      columnStyles: {
        0: { fontStyle: 'bold' },
        2: { halign: 'center' },
        3: { halign: 'center' }
      }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 10;
  } else {
    doc.setFontSize(12);
    doc.setTextColor(51, 51, 51); // Reset to dark gray for body text
    doc.text('No emergency services found', 14, yPosition);
    yPosition += 10;
  }
  
  return yPosition;
};
