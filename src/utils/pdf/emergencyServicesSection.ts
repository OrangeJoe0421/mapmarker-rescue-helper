
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { EmergencyService } from '@/types/mapTypes';

export const addEmergencyServicesSection = (
  doc: jsPDF,
  emergencyServices: EmergencyService[],
  yPosition: number
): number => {
  // Add a modern section header
  doc.setFillColor(34, 34, 34); // Dark background
  doc.rect(10, yPosition - 5, doc.internal.pageSize.getWidth() - 20, 10, 'F'); // Section header
  doc.setTextColor(255, 255, 255); // White text
  doc.setFontSize(14);
  doc.text('Emergency Services', 14, yPosition);
  doc.setTextColor(0, 0, 0); // Reset text color
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
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Name', 'Type', 'Distance', 'ER Available', 'Phone', 'Address', 'Hours']],
      body: emergencyServicesData,
      theme: 'grid',
      headStyles: { 
        fillColor: [249, 115, 22], // Stantec orange (#F97316)
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { left: 10, right: 10 },
      styles: {
        fontSize: 10,
        cellPadding: 3
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
