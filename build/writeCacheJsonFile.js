const path = require('path');
const fs = require('fs');
const { cwd, publicDirectory, dotDirectory } = require('./constants');

module.exports.default = function writeCacheJsonFile() {
  try {
    const dotDirectoryCacheFilePath = path.resolve(dotDirectory, 'cache.json');
    const publicDirectoryCacheFilePath = path.resolve(
      publicDirectory,
      'cache.json',
    );
    const configFilePath = path.resolve(cwd, 'router.config.json');

    const cache = (() => {
      if (fs.existsSync(configFilePath)) {
        const configFileContents = fs.readFileSync(configFilePath, 'utf-8');
        const config = JSON.parse(configFileContents);

        return {
          version: config.version,
        };
      } else {
        return {
          version: 1,
        };
      }
    })();

    const cacheFileContents = JSON.stringify(cache, null, 2);

    fs.writeFileSync(dotDirectoryCacheFilePath, cacheFileContents);
    fs.writeFileSync(publicDirectoryCacheFilePath, cacheFileContents);

    console.log('✅ Cache file written successfully!');
  } catch (error) {
    console.error('❌ Error writing cache file:', error);
  }
};
