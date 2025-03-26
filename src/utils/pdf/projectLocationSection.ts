
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { UserLocation } from '@/types/mapTypes';

export const addProjectLocationSection = (
  doc: jsPDF,
  userLocation: UserLocation | null,
  yPosition: number
): number => {
  // Dark header with white text
  doc.setFillColor(51, 51, 51, 0.8); // Dark gray with opacity
  doc.rect(10, yPosition - 5, doc.internal.pageSize.getWidth() - 20, 10, 'F'); // Section header
  doc.setTextColor(255, 255, 255); // White text
  doc.setFontSize(14);
  doc.text('Project Location', 14, yPosition);
  yPosition += 10;
  
  if (userLocation) {
    // Create location data, including metadata if available
    const userLocationData = [
      ['Latitude', userLocation.latitude?.toFixed(6) || 'N/A'],
      ['Longitude', userLocation.longitude?.toFixed(6) || 'N/A']
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
    
    // Clean table styling with white header text
    autoTable(doc, {
      startY: yPosition,
      head: [['Property', 'Value']],
      body: userLocationData,
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
        1: { halign: 'left' }
      }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 10;
  } else {
    doc.setFontSize(12);
    doc.setTextColor(51, 51, 51); // Reset to dark gray for body text
    doc.text('No project location set', 14, yPosition);
    yPosition += 10;
  }
  
  return yPosition;
};
