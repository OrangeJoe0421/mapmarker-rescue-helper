
/**
 * Utility functions for image processing and manipulation
 */

/**
 * Resizes and crops an image to fit specific dimensions while maintaining aspect ratio
 * @param imageSource The source image URL or data URL
 * @param targetWidth The desired width of the result image
 * @param targetHeight The desired height of the result image
 * @returns A Promise that resolves to the processed image data URL
 */
export const resizeAndCropImage = (
  imageSource: string,
  targetWidth: number,
  targetHeight: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      // Create a new image to load the source
      const img = new Image();
      
      // Handle errors in image loading
      img.onerror = (error) => {
        console.error('Error loading image for processing:', error);
        reject('Failed to load image for processing');
      };
      
      // Process the image when loaded
      img.onload = () => {
        try {
          // Use canvas to resize and crop the image
          const canvas = document.createElement('canvas');
          const tempCanvas = document.createElement('canvas');
          
          // First, render the full image to a temporary canvas at higher resolution
          // This helps with anti-aliasing during the resize
          const scale = 4; // Increase scale for better quality
          tempCanvas.width = img.width * scale;
          tempCanvas.height = img.height * scale;
          const tempCtx = tempCanvas.getContext('2d', { alpha: true }) as CanvasRenderingContext2D;
          
          if (!tempCtx) {
            reject('Could not get canvas context for image processing');
            return;
          }

          // Set final canvas dimensions with higher resolution
          canvas.width = targetWidth * 2;  // Double final resolution
          canvas.height = targetHeight * 2;
          const ctx = canvas.getContext('2d', { alpha: true }) as CanvasRenderingContext2D;
          
          if (!ctx) {
            reject('Could not get canvas context for image processing');
            return;
          }
          
          // Enable high quality image smoothing on both contexts
          tempCtx.imageSmoothingEnabled = true;
          tempCtx.imageSmoothingQuality = 'high';
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // Draw the image at higher resolution on the temp canvas with clear background first
          tempCtx.fillStyle = '#FFFFFF';
          tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
          tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
          
          // Calculate aspect ratios to determine scaling approach
          const sourceAspect = img.width / img.height;
          const targetAspect = targetWidth / targetHeight;
          
          let sourceWidth, sourceHeight, sourceX, sourceY;
          
          // Clear the canvas with a white background
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Determine if we need to crop width or height to maintain aspect ratio
          if (sourceAspect > targetAspect) {
            // Source is wider than target - crop width
            sourceHeight = img.height;
            sourceWidth = img.height * targetAspect;
            sourceX = (img.width - sourceWidth) / 2;
            sourceY = 0;
          } else {
            // Source is taller than target - crop height
            sourceWidth = img.width;
            sourceHeight = img.width / targetAspect;
            sourceX = 0;
            sourceY = (img.height - sourceHeight) / 2;
          }
          
          // Scale source coordinates for the temp canvas
          sourceX *= scale;
          sourceY *= scale;
          sourceWidth *= scale;
          sourceHeight *= scale;
          
          // Draw the image from the temp canvas to the final canvas with proper quality settings
          ctx.drawImage(
            tempCanvas,
            sourceX, sourceY, sourceWidth, sourceHeight,  // Source rectangle
            0, 0, canvas.width, canvas.height            // Destination rectangle
          );
          
          // Create a final smaller canvas for proper sizing
          const finalCanvas = document.createElement('canvas');
          finalCanvas.width = targetWidth;
          finalCanvas.height = targetHeight;
          const finalCtx = finalCanvas.getContext('2d', { alpha: true }) as CanvasRenderingContext2D;
          
          if (!finalCtx) {
            reject('Could not get canvas context for final processing');
            return;
          }
          
          // Enable high quality image smoothing
          finalCtx.imageSmoothingEnabled = true;
          finalCtx.imageSmoothingQuality = 'high';
          
          // Draw from higher resolution canvas to final size
          finalCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, targetWidth, targetHeight);
          
          // Get the processed image data with highest quality
          const processedImage = finalCanvas.toDataURL('image/png', 1.0);
          resolve(processedImage);
        } catch (err) {
          console.error('Error processing image:', err);
          reject('Error during image processing');
        }
      };
      
      // Enable crossOrigin if the image is from external source
      if (imageSource.startsWith('http') && !imageSource.includes(window.location.hostname)) {
        img.crossOrigin = 'anonymous';
      }
      
      // Set the source to begin loading
      img.src = imageSource;
      
    } catch (error) {
      console.error('Error in image resize and crop function:', error);
      reject('Error in image resize and crop function');
    }
  });
};
