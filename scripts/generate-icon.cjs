const fs = require('fs');
const pngToIcoModule = require('png-to-ico');
const path = require('path');

// Handle both default and named exports
const pngToIco = pngToIcoModule.default || pngToIcoModule;

const inputFile = path.join(__dirname, '../assets/icon.png');
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
