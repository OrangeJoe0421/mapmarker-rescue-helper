import jsPDF from 'jspdf';
import { ExportData } from './types';
import { addProjectLocationSection } from './projectLocationSection';
import { addEmergencyServicesSection } from './emergencyServicesSection';
import { addDetailedRouteInformation } from './routesSection';
import { addPdfFooter } from './pdfFooter';
import { mapCaptureService } from '../../components/MapCapture';
import { resizeAndCropImage } from '../imageUtils';

export * from './types';

// Add Stantec logo to PDF
const addStantecLogo = (doc: jsPDF, pageWidth: number) => {
  try {
    // Try to add the Stantec logo with the correct path
    doc.addImage('/lovable-uploads/e7fb8cc8-9b48-457c-a65f-7ed272d81060.png', 'PNG', 10, 10, 30, 30);
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

export const exportToPdf = async (data: ExportData) => {
  const { userLocation, emergencyServices, customMarkers, routes } = data;
  
  // Create a new PDF document
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Dark header gradient for white text
  doc.setFillColor(51, 51, 51, 0.8); // Dark gray with opacity
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Add Stantec logo
  addStantecLogo(doc, pageWidth);
  
  // Add title with white text
  doc.setTextColor(255, 255, 255); // White text
  doc.setFontSize(22);
  doc.text('Emergency Response Plan', pageWidth / 2, 22, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth / 2, 32, { align: 'center' });
  
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
  await addCapturedMapToPdf(doc, pageWidth);
  
  // Add footer
  addPdfFooter(doc);
  
  // Save the PDF
  doc.save('emergency-response-plan.pdf');
};

// Update addCapturedMapToPdf function to use the extracted image processing utility
const addCapturedMapToPdf = async (doc: jsPDF, pageWidth: number) => {
  try {
    const capturedImage = mapCaptureService.getCapturedImage();
    
    if (!capturedImage) {
      // Add a message if no map was captured
      doc.addPage();
      doc.setFillColor(51, 51, 51, 0.8);
      doc.rect(0, 0, pageWidth, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text('Map View', pageWidth / 2, 15, { align: 'center' });
      doc.setTextColor(51, 51, 51);
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
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('Map View with Routes', pageWidth / 2, 15, { align: 'center' });
    
    // Calculate dimensions
    const margins = 40; // Total margin on both sides
    const imgWidth = pageWidth - margins;
    const imgHeight = 200; // Fixed height for consistency
    
    try {
      // Use the extracted utility function to process the image
      const processedImage = await resizeAndCropImage(capturedImage, imgWidth, imgHeight);
      
      // Add the processed image to the PDF
      doc.addImage(processedImage, 'PNG', 20, 35, imgWidth, imgHeight);
      
      // Add a note about the map capture with more subtle styling
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text('Note: Map reflects the view at time of capture. To update the map view, use "Capture Map" again.', 
        pageWidth / 2, imgHeight + 45, { align: 'center', maxWidth: pageWidth - 40 });
      doc.setTextColor(51, 51, 51);
      
    } catch (processingError) {
      console.error('Error processing map image:', processingError);
      doc.setTextColor(51, 51, 51);
      doc.setFontSize(12);
      doc.text('Error processing map image', pageWidth / 2, 60, { align: 'center' });
    }
    
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
