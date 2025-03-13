
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const captureMapForPdf = async (
  doc: jsPDF,
  pageWidth: number
): Promise<void> => {
  try {
    // First, try to find a Leaflet map container
    let mapElement = document.querySelector('.leaflet-container') as HTMLElement;
    
    // If no Leaflet map, try to find ArcGIS map container
    if (!mapElement) {
      mapElement = document.querySelector('.esri-view-surface') as HTMLElement;
      
      // If still no map element found, use a more generic selector
      if (!mapElement) {
        const mapContainers = document.querySelectorAll('[data-map-container="true"]');
        if (mapContainers.length > 0) {
          mapElement = mapContainers[0] as HTMLElement;
        }
      }
    }
    
    if (mapElement) {
      // Add a new page for the map
      doc.addPage();
      
      doc.setFontSize(16);
      doc.text('Map View with Routes', pageWidth / 2, 15, { align: 'center' });
      
      // Wait longer to ensure all map elements, especially routes, are fully rendered
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Special handling for Leaflet maps
      if (mapElement.classList.contains('leaflet-container')) {
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
      }
      
      // Use html2canvas with improved settings for route visibility
      const canvas = await html2canvas(mapElement, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        scale: 2, // Higher resolution
        logging: false,
        onclone: (document, clonedElement) => {
          // For Leaflet maps
          if (clonedElement.classList.contains('leaflet-container')) {
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
          
          // For ArcGIS maps, make sure all canvas elements are visible
          if (clonedElement.classList.contains('esri-view-surface')) {
            const canvasElements = clonedElement.parentElement?.querySelectorAll('canvas');
            if (canvasElements) {
              canvasElements.forEach(canvas => {
                canvas.style.display = 'block';
                canvas.style.visibility = 'visible';
                canvas.style.opacity = '1';
              });
            }
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
