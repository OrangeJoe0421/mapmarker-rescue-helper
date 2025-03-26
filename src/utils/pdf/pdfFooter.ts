
import jsPDF from 'jspdf';

export const addPdfFooter = (doc: jsPDF): void => {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Add footer with gradient effect
    // Main color band
    doc.setFillColor(249, 115, 22, 0.8); // Stantec orange with transparency
    doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
    
    // Add page numbers
    doc.setTextColor(255, 255, 255); // White text
    doc.setFontSize(10);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
    
    // Add Stantec copyright with slightly smaller font
    doc.setFontSize(8);
    doc.text('© Stantec Emergency Response Planner', 10, pageHeight - 5);
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
  }
};
