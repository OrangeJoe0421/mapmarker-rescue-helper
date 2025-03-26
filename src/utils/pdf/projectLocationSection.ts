
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { UserLocation } from '@/types/mapTypes';

export const addProjectLocationSection = (
  doc: jsPDF,
  userLocation: UserLocation | null,
  yPosition: number
): number => {
  // Add a modern section header
  doc.setFillColor(34, 34, 34); // Dark background
  doc.rect(10, yPosition - 5, doc.internal.pageSize.getWidth() - 20, 10, 'F'); // Section header
  doc.setTextColor(255, 255, 255); // White text
  doc.setFontSize(14);
  doc.text('Project Location', 14, yPosition);
  doc.setTextColor(0, 0, 0); // Reset text color
  yPosition += 10;
  
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
    doc.text('No project location set', 14, yPosition);
    yPosition += 10;
  }
  
  return yPosition;
};
