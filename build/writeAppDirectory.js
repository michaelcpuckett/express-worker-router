const fs = require('fs');
const path = require('path');
const { appDirectory, srcDirectory } = require('./constants');

module.exports.default = function writeAppDirectory() {
  if (!fs.existsSync(srcDirectory)) {
    fs.mkdirSync(srcDirectory);
  }

  if (!fs.existsSync(appDirectory)) {
    fs.mkdirSync(appDirectory);

    const tsConfig = {
      compilerOptions: {
        strict: true,
        module: 'nodenext',
        esModuleInterop: true,
        skipLibCheck: true,
        moduleResolution: 'nodenext',
        sourceMap: true,
        declaration: true,
        noImplicitAny: true,
        removeComments: true,
        noLib: false,
        jsx: 'react-jsx',
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        target: 'ES2020',
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        useDefineForClassFields: false,
        isolatedModules: true,
        resolveJsonModule: true,
        baseUrl: '.',
        paths: {
          '*': ['*', './*/'],
        },
        types: ['../swarf-env.d.ts'],
      },
      include: ['./**/*'],
    };

    fs.writeFileSync(
      path.resolve(appDirectory, 'tsconfig.json'),
      JSON.stringify(tsConfig, null, 2),
    );

    fs.writeFileSync(
      path.resolve(appDirectory, 'index.html'),
      `<!DOCTYPE html><script src="/install.js"></script>`,
    );

    fs.writeFileSync(path.resolve(appDirectory, 'globals.css'), '');
  }
};
