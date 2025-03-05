
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { EmergencyService } from '@/types/mapTypes';

export const addEmergencyServicesSection = (
  doc: jsPDF,
  emergencyServices: EmergencyService[],
  yPosition: number
): number => {
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
  
  return yPosition;
};
