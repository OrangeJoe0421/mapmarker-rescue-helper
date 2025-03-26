import jsPDF from 'jspdf';
import { ExportData } from './types';
import { addProjectLocationSection } from './projectLocationSection';
import { addEmergencyServicesSection } from './emergencyServicesSection';
import { addRoutesSection, addDetailedRouteInformation } from './routesSection';
import { addPdfFooter } from './pdfFooter';
import { mapCaptureService } from '../../components/MapCapture';

export * from './types';

// Improved function to add the captured map to PDF
const addCapturedMapToPdf = (doc: jsPDF, pageWidth: number) => {
  try {
    const capturedImage = mapCaptureService.getCapturedImage();
    const captureTime = mapCaptureService.getCaptureTimestamp();
    
    if (!capturedImage) {
      // Add a message if no map was captured
      doc.addPage();
      doc.setFontSize(16);
      doc.text('Map View', pageWidth / 2, 15, { align: 'center' });
      doc.setFontSize(12);
      doc.text('No map capture available. Use the "Capture Map" button before exporting.', 
        pageWidth / 2, 40, { align: 'center', maxWidth: pageWidth - 20 });
      return;
    }
    
    // Add a new page for the map
    doc.addPage();
    doc.setFontSize(16);
    doc.text('Map View with Routes', pageWidth / 2, 15, { align: 'center' });
    
    // Add capture timestamp if available
    if (captureTime) {
      doc.setFontSize(10);
      doc.text(`Map captured on: ${captureTime.toLocaleString()}`, pageWidth / 2, 25, { align: 'center' });
    }
    
    // Calculate dimensions to fit on the page while maintaining aspect ratio
    const imgWidth = pageWidth - 20; // Margins
    
    // Use a fixed height to avoid scaling issues
    const imgHeight = 180; // Fixed reasonable height that works well for most maps
    
    // Add the map image to the PDF with fixed dimensions and move it down a bit to make room for the timestamp
    doc.addImage(capturedImage, 'PNG', 10, 30, imgWidth, imgHeight);
    
    // Add a note about the map capture
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100); // Gray text color
    doc.text('Note: Map reflects the view at time of capture. To update the map view, use "Capture Map" again.', 
      pageWidth / 2, imgHeight + 40, { align: 'center', maxWidth: pageWidth - 20 });
    doc.setTextColor(0, 0, 0); // Reset text color
    
  } catch (error) {
    console.error('Error adding captured map to PDF:', error);
    // Add a page with an error message if map capture fails
    doc.addPage();
    doc.setFontSize(16);
    doc.text('Map View', pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text('Error adding map image to the report', pageWidth / 2, 40, { align: 'center' });
  }
};

export const exportToPdf = async (data: ExportData) => {
  const { userLocation, emergencyServices, customMarkers, routes } = data;
  
  // Create a new PDF document
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Add title
  doc.setFontSize(20);
  doc.text('Emergency Response Plan', pageWidth / 2, 15, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth / 2, 22, { align: 'center' });
  
  let yPosition = 30;
  
  // Add project location section
  yPosition = addProjectLocationSection(doc, userLocation, yPosition);
  
  // Add emergency services section
  yPosition = addEmergencyServicesSection(doc, emergencyServices, yPosition);
  
  // Check if we need a new page
  if (yPosition > 230) {
    doc.addPage();
    yPosition = 20;
  }
  
  // Add routes section
  yPosition = addRoutesSection(doc, routes, customMarkers, emergencyServices, userLocation, yPosition);
  
  // Add detailed route information
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
