
import jsPDF from 'jspdf';
import { ExportData } from './types';
import { addProjectLocationSection } from './projectLocationSection';
import { addEmergencyServicesSection } from './emergencyServicesSection';
import { addRoutesSection, addDetailedRouteInformation } from './routesSection';
import { captureMapForPdf } from './mapCapture';
import { addPdfFooter } from './pdfFooter';

export * from './types';

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
  
  // Capture map image and add to PDF
  await captureMapForPdf(doc, pageWidth);
  
  // Add footer
  addPdfFooter(doc);
  
  // Save the PDF
  doc.save('emergency-response-plan.pdf');
};
