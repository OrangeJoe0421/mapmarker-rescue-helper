
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
      
      // Wait longer to ensure all map elements, especially routes, are fully rendered
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Make sure route lines are visible before capture
      const routeElements = document.querySelectorAll('.leaflet-overlay-pane path');
      routeElements.forEach(route => {
        if (route instanceof SVGElement) {
          route.style.stroke = '#3B82F6';
          route.style.strokeWidth = '4px';
          route.style.strokeOpacity = '0.9';
          route.style.display = 'block';
          route.style.visibility = 'visible';
        }
      });
      
      // Use html2canvas with improved settings for route visibility
      const canvas = await html2canvas(mapElement, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        scale: 2, // Higher resolution
        logging: false,
        onclone: (document, clonedElement) => {
          // Make sure the overlay pane containing routes is visible
          const overlayPanes = clonedElement.querySelectorAll('.leaflet-overlay-pane');
          overlayPanes.forEach(pane => {
            if (pane instanceof HTMLElement) {
              pane.style.display = 'block';
              pane.style.visibility = 'visible';
              pane.style.opacity = '1';
              pane.style.zIndex = '650'; // Ensure it's above other layers
            }
          });
          
          // Specifically target SVG paths (route lines)
          const routePaths = clonedElement.querySelectorAll('.leaflet-overlay-pane path');
          routePaths.forEach(path => {
            if (path instanceof SVGElement) {
              path.style.stroke = '#3B82F6';
              path.style.strokeWidth = '4px';
              path.style.strokeOpacity = '0.9';
              path.style.display = 'block';
              path.style.visibility = 'visible';
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
