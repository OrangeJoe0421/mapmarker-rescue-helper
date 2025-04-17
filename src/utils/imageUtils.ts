
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
          // Create a canvas to resize the image
          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject('Could not get canvas context for image processing');
            return;
          }
          
          // Enable image smoothing for better quality
          ctx.imageSmoothingEnabled = true;
          
          // Calculate dimensions to maintain aspect ratio
          const sourceAspect = img.width / img.height;
          const targetAspect = targetWidth / targetHeight;
          
          let sourceWidth, sourceHeight, sourceX, sourceY;
          
          // Fill with white background
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, targetWidth, targetHeight);
          
          // Determine if we need to crop width or height based on aspect ratio
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
          
          // Draw the image with calculated dimensions
          ctx.drawImage(
            img,
            sourceX, sourceY, sourceWidth, sourceHeight,  // Source rectangle
            0, 0, targetWidth, targetHeight               // Destination rectangle
          );
          
          // Get the image data as a data URL
          const processedImage = canvas.toDataURL('image/png');
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
