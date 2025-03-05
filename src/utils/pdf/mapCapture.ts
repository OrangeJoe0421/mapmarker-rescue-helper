
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const captureMapForPdf = async (
  doc: jsPDF,
  pageWidth: number
): Promise<void> => {
  try {
    const mapElement = document.querySelector('.leaflet-container') as HTMLElement;
    if (mapElement) {
      // Add a new page for the map
      doc.addPage();
      
      doc.setFontSize(16);
      doc.text('Map View with Routes', pageWidth / 2, 15, { align: 'center' });
      
      // Wait a small moment to ensure all map elements are rendered
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Use html2canvas to capture the map as an image with routes
      const canvas = await html2canvas(mapElement, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        scale: 2, // Higher resolution
        logging: true,
        onclone: (document, element) => {
          // This ensures that all map layers (including routes) are visible in the cloned document
          const routes = element.querySelectorAll('.leaflet-overlay-pane');
          routes.forEach(route => {
            if (route instanceof HTMLElement) {
              route.style.display = 'block';
              route.style.visibility = 'visible';
              route.style.opacity = '1';
            }
          });
        }
      });
      
      // Calculate dimensions to fit on the page while maintaining aspect ratio
      const imgWidth = pageWidth - 20; // Margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add the map image to the PDF
      const imgData = canvas.toDataURL('image/png');
      doc.addImage(imgData, 'PNG', 10, 25, imgWidth, imgHeight);
    }
  } catch (error) {
    console.error('Error capturing map:', error);
    // Add a page with an error message if map capture fails
    doc.addPage();
    doc.setFontSize(16);
    doc.text('Map View', pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text('Error generating map image', pageWidth / 2, 40, { align: 'center' });
  }
};
