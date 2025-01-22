const fs = require('fs');
const path = require('path');
const prettier = require('prettier');
const { windowDirectory } = require('./constants');
const tsConfig = require('./tsConfig').default;

module.exports.default = async function writeWindowDirectory() {
  const windowFileContent = await prettier.format(
    `
      import routesConfig from '../routes/index';
      import { hydrateAppRouter } from 'swarf/window';

      hydrateAppRouter({ routesConfig });
    `,
    {
      parser: 'typescript',
    },
  );

  try {
    if (!fs.existsSync(windowDirectory)) {
      fs.mkdirSync(windowDirectory);
    }

    fs.writeFileSync(
      path.resolve(windowDirectory, 'index.ts'),
      windowFileContent,
    );

    fs.writeFileSync(
      path.resolve(windowDirectory, 'tsconfig.json'),
      JSON.stringify(tsConfig, null, 2),
    );

    console.log('✅ Window TS files copied successfully!');
  } catch (error) {
    console.error('❌ Error copying window files:', error);
  }
};
