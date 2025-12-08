import fs from 'fs';
import pngToIco from 'png-to-ico';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputFile = path.join(__dirname, '../public/logo/android-chrome-512x512.png');
const outputFile = path.join(__dirname, '../public/logo/icon.ico');

console.log(`Generating .ico from ${inputFile}...`);

try {
    const buf = await pngToIco(inputFile);
    fs.writeFileSync(outputFile, buf);
    console.log('Successfully generated icon.ico');
} catch (err) {
    console.error('Error converting image:', err);
    process.exit(1);
}
