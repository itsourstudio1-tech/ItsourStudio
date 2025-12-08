const fs = require('fs');
const pngToIco = require('png-to-ico');
const path = require('path');

const inputFile = path.join(__dirname, '../public/logo/android-chrome-512x512.png');
const outputFile = path.join(__dirname, '../public/logo/icon.ico');

console.log(`Generating .ico from ${inputFile}...`);

pngToIco(inputFile)
    .then(buf => {
        fs.writeFileSync(outputFile, buf);
        console.log('Successfully generated icon.ico');
    })
    .catch(err => {
        console.error('Error converting image:', err);
        process.exit(1);
    });
