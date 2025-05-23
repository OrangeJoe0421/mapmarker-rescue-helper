
import jsPDF from 'jspdf';
import { ExportData } from './types';
import { addProjectLocationSection } from './projectLocationSection';
import { addEmergencyServicesSection } from './emergencyServicesSection';
import { addDetailedRouteInformation } from './routesSection';
import { addPdfFooter } from './pdfFooter';
import { mapCaptureService } from '../../components/MapCapture';

export * from './types';

// PDF header setup (without logo)
const addPdfHeader = (doc: jsPDF, pageWidth: number) => {
  // Dark header gradient for white text
  doc.setFillColor(51, 51, 51, 0.8); // Dark gray with opacity
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  // Add title with white text
  doc.setTextColor(255, 255, 255); // White text
  doc.setFontSize(22);
  doc.text('Emergency Response Plan', pageWidth / 2, 22, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth / 2, 32, { align: 'center' });
};

export const exportToPdf = async (data: ExportData) => {
  const { userLocation, emergencyServices, customMarkers, routes } = data;
  
  // Create a new PDF document
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Add header (without logo)
  addPdfHeader(doc, pageWidth);
  
  let yPosition = 60; // Start content further down after the header
  
  // 1. Add project location section
  yPosition = addProjectLocationSection(doc, userLocation, yPosition);
  
  // 2. Add emergency services section
  yPosition = addEmergencyServicesSection(doc, emergencyServices, yPosition);
  
  // 3. Add detailed route information for hospitals (only hospital routes)
  if (routes.length > 0) {
    addDetailedRouteInformation(doc, routes, customMarkers, emergencyServices, userLocation, pageWidth);
  }
  
  // Add captured map to PDF with improved implementation
  addCapturedMapToPdf(doc, pageWidth);
  
  // Add footer
  addPdfFooter(doc);
  
  // Save the PDF
  doc.save('emergency-response-plan.pdf');
};

// Update addCapturedMapToPdf function to use white text for headers
const addCapturedMapToPdf = (doc: jsPDF, pageWidth: number) => {
  try {
    const capturedImage = mapCaptureService.getCapturedImage();
    const captureTime = mapCaptureService.getCaptureTimestamp();
    
    if (!capturedImage) {
      // Add a message if no map was captured
      doc.addPage();
      doc.setFillColor(51, 51, 51, 0.8); // Dark gray with opacity
      doc.rect(0, 0, pageWidth, 20, 'F'); // Dark header
      doc.setTextColor(255, 255, 255); // White text
      doc.setFontSize(16);
      doc.text('Map View', pageWidth / 2, 15, { align: 'center' });
      doc.setTextColor(51, 51, 51); // Dark gray text
      doc.setFontSize(12);
      doc.text('No map capture available. Use the "Capture Map" button before exporting.', 
        pageWidth / 2, 40, { align: 'center', maxWidth: pageWidth - 40 });
      return;
    }
    
    // Add a new page for the map
    doc.addPage();
    
    // Dark header with white text
    doc.setFillColor(51, 51, 51, 0.8);
    doc.rect(0, 0, pageWidth, 20, 'F');
    doc.setTextColor(255, 255, 255); // White text
    doc.setFontSize(16);
    doc.text('Map View with Routes', pageWidth / 2, 15, { align: 'center' });
    
    // Calculate dimensions to fit on the page while maintaining aspect ratio
    const imgWidth = pageWidth - 40; // More margin for a cleaner look
    
    // Use a fixed height to avoid scaling issues
    const imgHeight = 180; // Fixed reasonable height that works well for most maps
    
    // Add the map image to the PDF with fixed dimensions and move it down a bit to make room for the timestamp
    doc.addImage(capturedImage, 'PNG', 20, 35, imgWidth, imgHeight);
    
    // Add a note about the map capture with more subtle styling
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120); // Lighter gray text color for notes
    doc.text('Note: Map reflects the view at time of capture. To update the map view, use "Capture Map" again.', 
      pageWidth / 2, imgHeight + 45, { align: 'center', maxWidth: pageWidth - 40 });
    doc.setTextColor(51, 51, 51); // Reset text color to standard
    
  } catch (error) {
    console.error('Error adding captured map to PDF:', error);
    // Add a page with an error message if map capture fails
    doc.addPage();
    doc.setFillColor(51, 51, 51, 0.8);
    doc.rect(0, 0, pageWidth, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('Map View', pageWidth / 2, 15, { align: 'center' });
    doc.setTextColor(51, 51, 51);
    doc.setFontSize(12);
    doc.text('Error adding map image to the report', pageWidth / 2, 40, { align: 'center' });
  }
};
