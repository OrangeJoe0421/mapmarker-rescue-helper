
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
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject('Could not get canvas context for image processing');
            return;
          }
          
          // Calculate scaling and cropping to maintain aspect ratio
          const scale = Math.max(targetWidth / img.width, targetHeight / img.height);
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;
          
          // Center crop
          const sx = (scaledWidth - targetWidth) / 2;
          const sy = (scaledHeight - targetHeight) / 2;
          
          // Clear the canvas and draw the resized and cropped image
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, targetWidth, targetHeight);
          
          ctx.drawImage(
            img, 
            sx, sy, targetWidth, targetHeight,  // Source rectangle
            0, 0, targetWidth, targetHeight     // Destination rectangle
          );
          
          // Get the processed image data
          const processedImage = canvas.toDataURL('image/png');
          resolve(processedImage);
        } catch (err) {
          console.error('Error processing image:', err);
          reject('Error during image processing');
        }
      };
      
      // Set the source to begin loading
      img.src = imageSource;
      
    } catch (error) {
      console.error('Error in image resize and crop function:', error);
      reject('Error in image resize and crop function');
    }
  });
};
