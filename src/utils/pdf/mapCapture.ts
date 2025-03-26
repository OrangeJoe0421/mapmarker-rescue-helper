
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
      
      // Wait much longer to ensure all map elements, especially routes, are fully rendered
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // ENHANCED ROUTE VISIBILITY: Apply stronger styles to make routes more visible
      const routeElements = document.querySelectorAll('.leaflet-overlay-pane path, .route-line, path.route-path, .leaflet-interactive');
      
      // Make copies of all route elements with enhanced visibility
      routeElements.forEach(route => {
        if (route instanceof SVGElement) {
          // Apply much stronger styles that will show in the capture
          route.setAttribute('stroke', '#FF3B30');
          route.setAttribute('stroke-width', '8');
          route.setAttribute('stroke-opacity', '1');
          route.setAttribute('stroke-dasharray', '');
          route.style.stroke = '#FF3B30'; 
          route.style.strokeWidth = '8px';
          route.style.strokeOpacity = '1';
          route.style.display = 'block';
          route.style.visibility = 'visible';
          route.style.zIndex = '9999';
        }
      });
      
      // Force parent SVG containers to be visible too
      document.querySelectorAll('svg.leaflet-zoom-animated').forEach(svg => {
        if (svg instanceof SVGElement) {
          svg.style.opacity = '1';
          svg.style.visibility = 'visible';
        }
      });
      
      // Make sure overlay panes are visible
      const overlayPanes = document.querySelectorAll('.leaflet-overlay-pane, .leaflet-pane');
      overlayPanes.forEach(pane => {
        if (pane instanceof HTMLElement) {
          pane.style.display = 'block';
          pane.style.visibility = 'visible';
          pane.style.opacity = '1';
          pane.style.zIndex = '999';
        }
      });
      
      // Use html2canvas with improved settings for route visibility
      const canvas = await html2canvas(mapElement, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        scale: 2, // Higher resolution
        logging: true, // Enable logging for debugging
        onclone: (document, clonedElement) => {
          console.log('Cloning for PDF capture', clonedElement);
          
          // Force all SVG elements to be visible in the clone
          const allSvgElements = clonedElement.querySelectorAll('svg, path');
          allSvgElements.forEach(el => {
            if (el instanceof SVGElement) {
              el.style.opacity = '1';
              el.style.visibility = 'visible';
              el.style.display = 'block';
            }
          });
          
          // Find all route paths in the cloned document
          const clonedRoutes = clonedElement.querySelectorAll('path.leaflet-interactive, .route-line, path');
          console.log('Found route elements in clone:', clonedRoutes.length);
          
          clonedRoutes.forEach(path => {
            // Apply even stronger styling to ensure visibility
            if (path instanceof SVGElement) {
              path.setAttribute('stroke', '#FF3B30');
              path.setAttribute('stroke-width', '8');
              path.setAttribute('stroke-opacity', '1');
              path.style.stroke = '#FF3B30';
              path.style.strokeWidth = '8px';
              path.style.strokeOpacity = '1';
              path.style.display = 'block';
              path.style.visibility = 'visible';
              path.style.zIndex = '9999';
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
