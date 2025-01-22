const fs = require('fs');
const path = require('path');
const prettier = require('prettier');
const { publicDirectory } = require('./constants');

module.exports.default = async function writePublicDirectory() {
  try {
    if (!fs.existsSync(publicDirectory)) {
      fs.mkdirSync(publicDirectory);
    }

    const installServiceWorkerFilePath = path.resolve(
      publicDirectory,
      'install.js',
    );

    const installServiceWorkerFileContent = await prettier.format(
      `
        window.navigator.serviceWorker
          .register('/service-worker.js')
          .catch((error) => {
            throw new Error('Service worker registration failed: ' + error);
          })
          .then(async (registration) => {
            const serviceWorker =
              registration.installing ||
              registration.waiting ||
              registration.active;

            if (!serviceWorker) {
              throw new Error('Service worker not found.');
            }

            await new Promise((resolve) => {
              if (serviceWorker.state === 'activated') {
                resolve();
              } else {
                serviceWorker.addEventListener('statechange', (event) => {
                  if (event.target.state === 'activated') {
                    resolve();
                  }
                });
              }
            });

            window.location.reload();
          })
          .catch((error) => {
            console.error(error);
          });
        `,
      {
        parser: 'typescript',
      },
    );

    fs.writeFileSync(
      installServiceWorkerFilePath,
      installServiceWorkerFileContent,
    );

    console.log('✅ Public directory created successfully!');
  } catch (error) {
    console.error('❌ Error creating public directory:', error);
  }
};
