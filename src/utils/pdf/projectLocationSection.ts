
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { UserLocation } from '@/types/mapTypes';

export const addProjectLocationSection = (
  doc: jsPDF,
  userLocation: UserLocation | null,
  yPosition: number
): number => {
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
  
  return yPosition;
};
