
import jsPDF from 'jspdf';
import { ExportData } from './types';
import { addProjectLocationSection } from './projectLocationSection';
import { addEmergencyServicesSection } from './emergencyServicesSection';
import { addRoutesSection, addDetailedRouteInformation } from './routesSection';
import { addPdfFooter } from './pdfFooter';
import { mapCaptureService } from '../../components/MapCapture';

export * from './types';

// Add this new function to handle adding the captured map to the PDF
const addCapturedMapToPdf = (doc: jsPDF, pageWidth: number) => {
  try {
    const capturedImage = mapCaptureService.getCapturedImage();
    
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
    
    // Calculate dimensions to fit on the page while maintaining aspect ratio
    const imgWidth = pageWidth - 20; // Margins
    const image = new Image();
    image.src = capturedImage;
    const imgHeight = (image.height * imgWidth) / image.width;
    
    // Add the map image to the PDF
    doc.addImage(capturedImage, 'PNG', 10, 25, imgWidth, imgHeight);
    
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
  
  // Add captured map to PDF (replacing the old captureMapForPdf function)
  addCapturedMapToPdf(doc, pageWidth);
  
  // Add footer
  addPdfFooter(doc);
  
  // Save the PDF
  doc.save('emergency-response-plan.pdf');
};
