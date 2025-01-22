const fs = require('fs');
const path = require('path');
const prettier = require('prettier');
const { serviceWorkerDirectory } = require('./constants');
const tsConfig = require('./tsConfig').default;

module.exports.default = async function writeServiceWorkerDirectory() {
  const serviceWorkerFileContent = await prettier.format(
    `
      import { version } from '../cache.json';
      import routesConfig from '../routes/index';
      import staticFiles from '../static.json';
      import { useAppRouter } from 'swarf/service-worker';
      
      useAppRouter({ routesConfig, staticFiles, version });
    `,
    {
      parser: 'typescript',
    },
  );

  try {
    if (!fs.existsSync(serviceWorkerDirectory)) {
      fs.mkdirSync(serviceWorkerDirectory);
    }

    fs.writeFileSync(
      path.resolve(serviceWorkerDirectory, 'index.ts'),
      serviceWorkerFileContent,
    );

    fs.writeFileSync(
      path.resolve(serviceWorkerDirectory, 'tsconfig.json'),
      JSON.stringify(tsConfig, null, 2),
    );

    console.log('✅ Service worker TS files copied successfully!');
  } catch (error) {
    console.error('❌ Error copying service worker TS files:', error);
  }
};
