
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const captureMapForPdf = async (
  doc: jsPDF,
  pageWidth: number
): Promise<void> => {
  try {
    // First, try to find a Leaflet map container
    let mapElement = document.querySelector('.leaflet-container') as HTMLElement;
    
    // If no Leaflet map, try to find a more generic selector
    if (!mapElement) {
      const mapContainers = document.querySelectorAll('[data-map-container="true"]');
      if (mapContainers.length > 0) {
        mapElement = mapContainers[0] as HTMLElement;
      }
    }
    
    if (mapElement) {
      // Add a new page for the map
      doc.addPage();
      
      doc.setFontSize(16);
      doc.text('Map View with Routes', pageWidth / 2, 15, { align: 'center' });
      
      // Wait longer to ensure all map elements, especially routes, are fully rendered
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Special handling for Leaflet maps - make sure route lines are visible
      const routeElements = document.querySelectorAll('.leaflet-overlay-pane path, .route-line, path.route-path');
      const routePaths = document.querySelectorAll('path.leaflet-interactive');
      
      // Force routes to be visible and styled prominently
      [...routeElements, ...routePaths].forEach(route => {
        if (route instanceof SVGElement) {
          route.style.stroke = '#3B82F6';
          route.style.strokeWidth = '6px';
          route.style.strokeOpacity = '1';
          route.style.display = 'block';
          route.style.visibility = 'visible';
          route.style.zIndex = '1000';
        }
      });
      
      // Make sure overlay panes are visible
      const overlayPanes = document.querySelectorAll('.leaflet-overlay-pane');
      overlayPanes.forEach(pane => {
        if (pane instanceof HTMLElement) {
          pane.style.display = 'block';
          pane.style.visibility = 'visible';
          pane.style.opacity = '1';
          pane.style.zIndex = '650';
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
          if (clonedElement.classList.contains('leaflet-container')) {
            // Force all overlay panes to be visible in the clone
            const clonedOverlayPanes = clonedElement.querySelectorAll('.leaflet-overlay-pane');
            clonedOverlayPanes.forEach(pane => {
              if (pane instanceof HTMLElement) {
                pane.style.display = 'block';
                pane.style.visibility = 'visible';
                pane.style.opacity = '1';
                pane.style.zIndex = '650'; 
              }
            });
            
            // Force all SVG paths (route lines) to be visible and styled prominently
            const clonedRouteElements = clonedElement.querySelectorAll('.leaflet-overlay-pane path, path.leaflet-interactive, .route-line');
            clonedRouteElements.forEach(path => {
              if (path instanceof SVGElement) {
                path.style.stroke = '#3B82F6';
                path.style.strokeWidth = '6px';
                path.style.strokeOpacity = '1';
                path.style.display = 'block';
                path.style.visibility = 'visible';
                path.style.zIndex = '1000';
              }
            });
          }
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
