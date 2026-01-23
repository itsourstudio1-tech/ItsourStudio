// Compress and optimize all existing images in Firebase Storage
// Uses Firebase Admin SDK for proper authentication
import { config } from 'dotenv';
config();

import admin from 'firebase-admin';

// Initialize Firebase Admin
const serviceAccount = {
    type: "service_account",
    project_id: process.env.VITE_FIREBASE_PROJECT_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
};

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET
});

const bucket = admin.storage().bucket();

// Node.js version of image compression using Canvas with WebP output
async function compressImageNode(imageBuffer, maxWidth = 1920, quality = 0.75) {
    const { createCanvas, loadImage } = await import('canvas');

    const img = await loadImage(imageBuffer);
    let width = img.width;
    let height = img.height;

    // Resize if needed
    if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
    }

    const maxHeight = 1080;
    if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
    }

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Fill white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // Draw image
    ctx.drawImage(img, 0, 0, width, height);

    // Try WebP first, fallback to JPEG if WebP encoding fails
    try {
        const webpBuffer = canvas.toBuffer('image/webp', { quality });
        if (webpBuffer && webpBuffer.length > 0) {
            return { buffer: webpBuffer, format: 'webp' };
        }
    } catch (webpError) {
        console.log('      ⚠️  WebP encoding failed, using JPEG instead');
    }

    // Fallback to JPEG
    const jpegBuffer = canvas.toBuffer('image/jpeg', { quality });
    return { buffer: jpegBuffer, format: 'jpeg' };
}

async function compressStorageImages() {
    console.log('🔍 Scanning Firebase Storage for images...\n');

    const folders = ['gallery', 'services', 'carousel'];
    let totalProcessed = 0;
    let totalSaved = 0;

    for (const folder of folders) {
        console.log(`\n📁 Processing folder: ${folder}`);

        try {
            const [files] = await bucket.getFiles({ prefix: `${folder}/` });
            const imageFiles = files.filter(file =>
                file.name.match(/\.(jpg|jpeg|png|webp)$/i) &&
                !file.name.endsWith('/')
            );

            if (imageFiles.length === 0) {
                console.log(`   ⚠️  No images found in ${folder}`);
                continue;
            }

            console.log(`   Found ${imageFiles.length} images`);

            for (const file of imageFiles) {
                try {
                    const fileName = file.name.split('/').pop();

                    // Download image
                    const [buffer] = await file.download();
                    const originalSize = buffer.length;

                    // Skip if already small enough (< 150KB for WebP)
                    if (originalSize < 150 * 1024) {
                        console.log(`   ⏭️  Skipping ${fileName} (already optimized: ${(originalSize / 1024).toFixed(0)}KB)`);
                        continue;
                    }

                    console.log(`   🔄 Compressing ${fileName}...`);

                    // Use more aggressive compression (quality 70 is still excellent)
                    const { buffer: compressedBuffer, format } = await compressImageNode(buffer, 1920, 0.70);
                    const compressedSize = compressedBuffer.length;
                    const reduction = ((1 - compressedSize / originalSize) * 100).toFixed(1);

                    // Only upload if compression actually reduced size
                    if (compressedSize < originalSize) {
                        // Upload compressed version (overwrite)
                        await file.save(compressedBuffer, {
                            metadata: {
                                contentType: `image/${format}`,
                                cacheControl: 'public, max-age=31536000'
                            }
                        });

                        const savedKB = ((originalSize - compressedSize) / 1024).toFixed(0);
                        totalSaved += (originalSize - compressedSize);
                        totalProcessed++;

                        console.log(`   ✅ ${fileName}: ${(originalSize / 1024).toFixed(0)}KB → ${(compressedSize / 1024).toFixed(0)}KB (${reduction}% reduction, saved ${savedKB}KB) [${format.toUpperCase()}]`);
                    } else {
                        console.log(`   ⚠️  ${fileName}: Compression didn't reduce size, keeping original`);
                    }

                } catch (error) {
                    console.error(`   ❌ Error processing ${file.name}:`, error.message);
                }
            }
        } catch (error) {
            console.error(`   ❌ Error accessing folder ${folder}:`, error.message);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✨ Compression Complete!`);
    console.log(`   📊 Images processed: ${totalProcessed}`);
    console.log(`   💾 Total space saved: ${(totalSaved / 1024 / 1024).toFixed(2)}MB`);
    console.log('='.repeat(60) + '\n');
}

async function main() {
    try {
        console.log('🚀 Starting image compression process...\n');
        console.log('⚠️  NOTE: This will overwrite existing images with compressed versions.');
        console.log('   Make sure you have backups if needed!\n');

        // Check for required environment variables
        if (!process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
            console.error('❌ Missing Firebase Admin credentials!');
            console.error('   Please add FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL to your .env file');
            console.error('   You can get these from Firebase Console > Project Settings > Service Accounts');
            process.exit(1);
        }

        await compressStorageImages();

        console.log('🎉 All done! Your images are now optimized.\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    }
}

main();
