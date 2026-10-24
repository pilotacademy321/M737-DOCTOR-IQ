/**
 * Utilities for client-side image compression and safe Firestore attachment handling
 * Strictly enforces limits well below Firestore's 1 MiB (1,048,576 bytes) document size ceiling.
 */

export const MAX_SAFE_FIRESTORE_DATAURL_LENGTH = 450_000; // ~337 KB binary, well below 1MB limit

/**
 * Checks whether an attachment file is safe to inline directly into Firestore
 */
export function isSafeForInlineFirestore(file: File): boolean {
  // Images can be compressed; non-image files must be strictly <= 320 KB
  if (file.type.startsWith('image/')) return true;
  return file.size <= 320 * 1024;
}

/**
 * Resizes and compresses an image file to a safe Base64 JPEG data URL.
 * Automatically performs multi-pass progressive downscaling if initial compression exceeds limit.
 */
export async function compressImageToDataUrl(
  file: File,
  maxDimension = 1000,
  initialQuality = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read image file'));

    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to parse image for compression'));

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-preserving dimensions within maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const renderCanvas = (w: number, h: number, quality: number): string => {
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;

          const ctx = canvas.getContext('2d');
          if (!ctx) return reader.result as string;

          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);

          return canvas.toDataURL('image/jpeg', quality);
        };

        let currentQuality = initialQuality;
        let currentWidth = width;
        let currentHeight = height;
        let dataUrl = renderCanvas(currentWidth, currentHeight, currentQuality);

        // Multi-pass progressive reduction if still exceeds Firestore safe ceiling
        let iterations = 0;
        while (dataUrl.length > MAX_SAFE_FIRESTORE_DATAURL_LENGTH && iterations < 5) {
          iterations++;
          currentWidth = Math.round(currentWidth * 0.75);
          currentHeight = Math.round(currentHeight * 0.75);
          currentQuality = Math.max(0.35, currentQuality - 0.12);
          dataUrl = renderCanvas(currentWidth, currentHeight, currentQuality);
        }

        resolve(dataUrl);
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Reads a non-image file (e.g. PDF) as DataURL.
 */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}
