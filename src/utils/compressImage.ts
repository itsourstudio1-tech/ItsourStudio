/**
 * Compresses an image file using the browser's Canvas API.
 * Automatically uses WebP format if supported, falls back to JPEG.
 * Implements aggressive compression for large images.
 * @param file The file to compress
 * @param maxWidth The maximum width of the output image (default: 1920)
 * @param quality The quality of the output (0.0 to 1.0, default: 0.75)
 * @returns A Promise that resolves to the compressed Blob
 */
export const compressImage = (file: File, maxWidth: number = 1920, quality: number = 0.75): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // More aggressive resizing for very large images
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                // Additional optimization: cap height as well
                const maxHeight = 1080;
                if (height > maxHeight) {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d', { alpha: false });
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                // Enable image smoothing for better quality
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';

                // Fill with white background (important for transparent PNGs)
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);

                ctx.drawImage(img, 0, 0, width, height);

                // Try WebP first (better compression), fallback to JPEG
                const supportsWebP = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
                const mimeType = supportsWebP ? 'image/webp' : 'image/jpeg';

                // Adjust quality based on image size for better optimization
                let adjustedQuality = quality;
                const pixels = width * height;
                if (pixels > 2000000) { // Very large images (>2MP)
                    adjustedQuality = Math.min(quality, 0.7);
                } else if (pixels > 1000000) { // Large images (>1MP)
                    adjustedQuality = Math.min(quality, 0.75);
                }

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            // Log compression results for debugging
                            const originalSize = file.size;
                            const compressedSize = blob.size;
                            const reduction = ((1 - compressedSize / originalSize) * 100).toFixed(1);
                            console.log(`📸 Image compressed: ${(originalSize / 1024 / 1024).toFixed(2)}MB → ${(compressedSize / 1024 / 1024).toFixed(2)}MB (${reduction}% reduction) [${mimeType}]`);
                            resolve(blob);
                        } else {
                            reject(new Error('Canvas to Blob conversion failed'));
                        }
                    },
                    mimeType,
                    adjustedQuality
                );
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};
