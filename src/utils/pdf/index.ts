
import jsPDF from 'jspdf';
import { ExportData } from './types';
import { addProjectLocationSection } from './projectLocationSection';
import { addEmergencyServicesSection } from './emergencyServicesSection';
import { addRoutesSection, addDetailedRouteInformation } from './routesSection';
import { addPdfFooter } from './pdfFooter';
import { mapCaptureService } from '../../components/MapCapture';

export * from './types';

// Add logo to PDF
const addStantecLogo = (doc: jsPDF, pageWidth: number) => {
  try {
    // Try to add the Stantec logo
    doc.addImage('/stantec-logo-orange.png', 'PNG', 10, 10, 30, 30);
  } catch (error) {
    console.error('Error adding Stantec logo to PDF:', error);
    // If logo not found, continue without it
    try {
      // Attempt to use the SVG fallback
      doc.addImage('https://www.stantec.com/content/dam/stantec/images/logos/stantec-logo.svg', 'SVG', 10, 10, 30, 30);
    } catch (svgError) {
      console.error('Failed to add SVG fallback logo:', svgError);
      // Continue without logo if both attempts fail
    }
  }
};

// Improved function to add the captured map to PDF
const addCapturedMapToPdf = (doc: jsPDF, pageWidth: number) => {
  try {
    const capturedImage = mapCaptureService.getCapturedImage();
    const captureTime = mapCaptureService.getCaptureTimestamp();
    
    if (!capturedImage) {
      // Add a message if no map was captured
      doc.addPage();
      doc.setFillColor(249, 115, 22); // Stantec orange
      doc.rect(0, 0, pageWidth, 20, 'F'); // Orange header
      doc.setTextColor(255, 255, 255); // White text
      doc.setFontSize(16);
      doc.text('Map View', pageWidth / 2, 15, { align: 'center' });
      doc.setTextColor(0, 0, 0); // Reset text color
      doc.setFontSize(12);
      doc.text('No map capture available. Use the "Capture Map" button before exporting.', 
        pageWidth / 2, 40, { align: 'center', maxWidth: pageWidth - 20 });
      return;
    }
    
    // Add a new page for the map
    doc.addPage();
    
    // Stantec orange header
    doc.setFillColor(249, 115, 22); // Stantec orange
    doc.rect(0, 0, pageWidth, 20, 'F'); // Orange header
    doc.setTextColor(255, 255, 255); // White text
    doc.setFontSize(16);
    doc.text('Map View with Routes', pageWidth / 2, 15, { align: 'center' });
    doc.setTextColor(0, 0, 0); // Reset text color
    
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
    doc.setFillColor(249, 115, 22); // Stantec orange
    doc.rect(0, 0, pageWidth, 20, 'F'); // Orange header
    doc.setTextColor(255, 255, 255); // White text
    doc.setFontSize(16);
    doc.text('Map View', pageWidth / 2, 15, { align: 'center' });
    doc.setTextColor(0, 0, 0); // Reset text color
    doc.setFontSize(12);
    doc.text('Error adding map image to the report', pageWidth / 2, 40, { align: 'center' });
  }
};

export const exportToPdf = async (data: ExportData) => {
  const { userLocation, emergencyServices, customMarkers, routes } = data;
  
  // Create a new PDF document
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Add Stantec brand color as the header
  doc.setFillColor(249, 115, 22); // Stantec orange (#F97316)
  doc.rect(0, 0, pageWidth, 40, 'F'); // Orange header

  // Add Stantec logo
  addStantecLogo(doc, pageWidth);
  
  // Add title with white text color
  doc.setTextColor(255, 255, 255); // White text
  doc.setFontSize(20);
  doc.text('Emergency Response Plan', pageWidth / 2, 20, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth / 2, 30, { align: 'center' });
  
  // Reset text color to black for remaining content
  doc.setTextColor(0, 0, 0);
  
  let yPosition = 50; // Start content after header
  
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
