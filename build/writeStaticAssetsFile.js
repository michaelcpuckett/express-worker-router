const fs = require('fs');
const path = require('path');
const { dotDirectory } = require('./constants');
const getStaticFiles = require('./getStaticFiles').default;

module.exports.default = function writeStaticAssetsFile() {
  try {
    const staticFiles = getStaticFiles();
    const outputPath = path.resolve(dotDirectory, 'static.json');

    fs.writeFileSync(outputPath, JSON.stringify(staticFiles, null, 2));

    console.log(`✅ Static files generated successfully!`);
  } catch (error) {
    console.error('❌ Error generating static files:', error);
  }
};
