
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { EmergencyService } from '@/types/mapTypes';

export const addEmergencyServicesSection = (
  doc: jsPDF,
  emergencyServices: EmergencyService[],
  yPosition: number
): number => {
  // Add a modern section header - more subtle with gradient effect
  doc.setFillColor(60, 60, 60, 0.9); // Dark background with transparency
  doc.rect(10, yPosition - 5, doc.internal.pageSize.getWidth() - 20, 10, 'F'); // Section header
  doc.setTextColor(255, 255, 255); // White text
  doc.setFontSize(14);
  doc.text('Emergency Services', 14, yPosition);
  doc.setTextColor(51, 51, 51); // Reset to dark gray text
  yPosition += 10;
  
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
    
    // More modern table styling
    autoTable(doc, {
      startY: yPosition,
      head: [['Name', 'Type', 'Distance', 'ER Available', 'Phone', 'Address', 'Hours']],
      body: emergencyServicesData,
      theme: 'grid',
      headStyles: { 
        fillColor: [249, 115, 22, 0.85], // Stantec orange with transparency
        textColor: 255,
        fontStyle: 'bold',
        cellPadding: 4
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245, 0.5] // Very light gray with transparency
      },
      margin: { left: 10, right: 10 },
      styles: {
        fontSize: 9,
        cellPadding: 4,
        lineColor: [220, 220, 220], // Lighter grid lines
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
    doc.text('No emergency services found', 14, yPosition);
    yPosition += 10;
  }
  
  return yPosition;
};
