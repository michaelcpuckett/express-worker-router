const fs = require('fs');
const { dotDirectory } = require('./constants');
const writeCacheJsonFile = require('./writeCacheJsonFile').default;
const writeWindowDirectory = require('./writeWindowDirectory').default;
const writeServiceWorkerDirectory =
  require('./writeServiceWorkerDirectory').default;
const writeRoutesConfigDirectory =
  require('./writeRoutesConfigDirectory').default;

module.exports.default = async function writeDotDirectory() {
  try {
    if (!fs.existsSync(dotDirectory)) {
      fs.mkdirSync(dotDirectory);
    }

    console.log('✅ Dot directory created successfully!');
  } catch (error) {
    console.error('❌ Error creating dot directory:', error);
  }

  writeCacheJsonFile();
  await writeWindowDirectory();
  await writeServiceWorkerDirectory();
  await writeRoutesConfigDirectory();
};
