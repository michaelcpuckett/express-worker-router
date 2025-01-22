const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
const { publicDirectory } = require('./constants');
const cssModulesPlugin = require('esbuild-css-modules-plugin');

module.exports.default = async function runEsBuild() {
  try {
    const esbuildConfig = {
      logLevel: 'warning',
      bundle: true,
      platform: 'browser',
      target: 'es2018',
      format: 'cjs',
      sourcemap: false,
      plugins: [cssModulesPlugin()],
    };

    await esbuild.build({
      ...esbuildConfig,
      tsconfig: './.swarf/service-worker/tsconfig.json',
      outfile: 'public/service-worker.js',
      entryPoints: ['./.swarf/service-worker/index.ts'],
    });

    if (fs.existsSync(path.resolve(publicDirectory, 'service-worker.css'))) {
      fs.rmSync(path.resolve(publicDirectory, 'service-worker.css'));
    }

    console.log('✅ Service worker file built successfully!');

    await esbuild.build({
      ...esbuildConfig,
      tsconfig: './.swarf/window/tsconfig.json',
      outfile: 'public/window.js',
      entryPoints: ['./.swarf/window/index.ts'],
    });

    console.log('✅ Window file built successfully!');
  } catch (error) {
    console.error('❌ Error building project:', error);
  }
};
