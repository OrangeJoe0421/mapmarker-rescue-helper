
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { UserLocation } from '@/types/mapTypes';

export const addProjectLocationSection = (
  doc: jsPDF,
  userLocation: UserLocation | null,
  yPosition: number
): number => {
  // Add a modern section header with gradient effect
  doc.setFillColor(60, 60, 60, 0.9); // Dark background with transparency
  doc.rect(10, yPosition - 5, doc.internal.pageSize.getWidth() - 20, 10, 'F'); // Section header
  doc.setTextColor(255, 255, 255); // White text
  doc.setFontSize(14);
  doc.text('Project Location', 14, yPosition);
  doc.setTextColor(51, 51, 51); // Dark gray text for content
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
    
    // More modern table styling
    autoTable(doc, {
      startY: yPosition,
      head: [['Property', 'Value']],
      body: userLocationData,
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
        0: { fontStyle: 'bold', fillColor: [249, 115, 22, 0.1] }, // Very light orange for property names
        1: { halign: 'left' }
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
