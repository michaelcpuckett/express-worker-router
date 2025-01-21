#!/usr/bin/env node

const esbuild = require('esbuild');
const fs = require('fs');
const fsPromises = require('node:fs/promises');
const path = require('path');
const prettier = require('prettier');
const throttle = require('lodash.throttle');
const httpServer = require('http-server');
const cwd = process.cwd();
const dotDirectory = path.resolve(cwd, '.ewr');
const windowDirectory = path.resolve(dotDirectory, 'window');
const serviceWorkerDirectory = path.resolve(dotDirectory, 'service-worker');
const nestedDirectoryTsConfig = {
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
    paths: {
      'app/*': ['../../src/app/*'],
      'components/*': ['../../src/components/*'],
      'utils/*': ['../../src/utils/*'],
    },
    plugins: [{ name: 'typescript-plugin-css-modules' }],
  },
  include: ['./*'],
};

async function writePublicDirectory() {
  try {
    const publicDirectoryPath = path.resolve(cwd, 'public');

    if (!fs.existsSync(publicDirectoryPath)) {
      fs.mkdirSync(publicDirectoryPath);
    }

    const installServiceWorkerFilePath = path.resolve(
      publicDirectoryPath,
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

    const NotFoundFilePath = path.resolve(publicDirectoryPath, '404.html');

    if (!fs.existsSync(NotFoundFilePath)) {
      const NotFoundFileContent = await prettier.format(
        `<script src="/install.js"></script>`,
        {
          parser: 'html',
        },
      );

      fs.writeFileSync(NotFoundFilePath, NotFoundFileContent);
    }

    const criticalCssFilePath = path.resolve(
      publicDirectoryPath,
      'critical.css',
    );

    if (!fs.existsSync(criticalCssFilePath)) {
      fs.writeFileSync(criticalCssFilePath, '');
    }

    console.log('✅ Public directory created successfully!');
  } catch (error) {
    console.error('❌ Error creating public directory:', error);
  }
}

async function writeDotDirectory() {
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
  writeStaticAssetsFile();
}

function getRoutesFromAppDirectory() {
  const routes = [];
  const appDir = path.resolve(cwd, './src/app');

  function traverseDirectory(currentDir) {
    const files = fs.readdirSync(currentDir);

    files.forEach((file) => {
      const filePath = path.resolve(currentDir, file);

      if (fs.lstatSync(filePath).isDirectory()) {
        traverseDirectory(filePath);
      } else if (file.endsWith('.tsx')) {
        const pageName = path
          .relative(appDir, filePath)
          .replace(/\\/g, '/')
          .replace(/\.tsx$/, '');
        routes.push(`/${pageName}`);
      }
    });
  }

  traverseDirectory(appDir);

  return routes;
}

function toCamelCase(string) {
  return string.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

async function writeRoutesConfigDirectory() {
  try {
    const routes = getRoutesFromAppDirectory();
    const routeConfigDirectoryPath = path.resolve(dotDirectory, 'routes');

    if (!fs.existsSync(routeConfigDirectoryPath)) {
      fs.mkdirSync(routeConfigDirectoryPath);
    }

    const routesConfigFileContent = await prettier.format(
      `
      const Routes: Record<string, any> = {};

      ${routes
        .map((route) => {
          const routeSlug = toCamelCase(
            route.replace(/\//g, '-').replace(/[\[\]]/g, ''),
          );

          return `
            import * as ${routeSlug} from 'app${route}';

            Routes['${
              route.replace('page', '').replace(/\/$/, '') || '/'
            }'] = ${routeSlug};
          `;
        })
        .join('\n')}
        
      export default Routes;
    `,
      {
        parser: 'typescript',
      },
    );

    fs.writeFileSync(
      path.resolve(routeConfigDirectoryPath, 'index.ts'),
      routesConfigFileContent,
    );

    fs.writeFileSync(
      path.resolve(routeConfigDirectoryPath, 'tsconfig.json'),
      JSON.stringify(nestedDirectoryTsConfig, null, 2),
    );
    console.log(`✅ Routes generated successfully!`);
  } catch (error) {
    console.error('❌ Error generating routes:', error);
  }
}

function getStaticFiles() {
  return Array.from(
    new Set([
      '404.html',
      'install.js',
      'service-worker.js',
      'window.js',
      'cache.json',
      'critical.css',
      'window.css',
      ...fs.readdirSync(path.resolve(cwd, 'public')),
    ]),
  )
    .filter((file) => {
      return file !== 'service-worker.css';
    })
    .map((file) => {
      return '/' + file;
    });
}

function writeStaticAssetsFile() {
  try {
    const staticFiles = getStaticFiles();
    const outputPath = path.resolve(dotDirectory, 'static.json');

    fs.writeFileSync(outputPath, JSON.stringify(staticFiles, null, 2));

    console.log(`✅ Static files generated successfully!`);
  } catch (error) {
    console.error('❌ Error generating static files:', error);
  }
}

function writeCacheJsonFile() {
  try {
    const dotDirectoryCacheFilePath = path.resolve(dotDirectory, 'cache.json');
    const publicDirectoryCacheFilePath = path.resolve(cwd, 'public/cache.json');
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
}

async function runEsBuild() {
  try {
    const esbuildConfig = {
      logLevel: 'warning',
      bundle: true,
      platform: 'browser',
      target: 'es2018',
      format: 'cjs',
      sourcemap: false,
    };

    await esbuild.build({
      ...esbuildConfig,
      tsconfig: './.ewr/service-worker/tsconfig.json',
      outfile: 'public/service-worker.js',
      entryPoints: ['./.ewr/service-worker/index.ts'],
    });

    fs.rmSync(path.resolve(cwd, 'public', 'service-worker.css'));

    console.log('✅ Service worker file built successfully!');

    await esbuild.build({
      ...esbuildConfig,
      tsconfig: './.ewr/window/tsconfig.json',
      outfile: 'public/window.js',
      entryPoints: ['./.ewr/window/index.ts'],
    });

    console.log('✅ Window file built successfully!');
  } catch (error) {
    console.error('❌ Error building project:', error);
  }
}

async function writeWindowDirectory() {
  const windowFileContent = await prettier.format(
    `
    import routesConfig from '../routes/index';
    import { hydrateAppRouter } from '@express-worker/router/window';

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
      JSON.stringify(nestedDirectoryTsConfig, null, 2),
    );

    console.log('✅ Window TS files copied successfully!');
  } catch (error) {
    console.error('❌ Error copying window files:', error);
  }
}

async function writeServiceWorkerDirectory() {
  const serviceWorkerFileContent = await prettier.format(
    `
    import { version } from '../cache.json';
    import routesConfig from '../routes/index';
    import staticFiles from '../static.json';
    import { useAppRouter } from '@express-worker/router/service-worker';
    
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
      JSON.stringify(nestedDirectoryTsConfig, null, 2),
    );

    console.log('✅ Service worker TS files copied successfully!');
  } catch (error) {
    console.error('❌ Error copying service worker TS files:', error);
  }
}

module.exports.build = () => {
  writePublicDirectory().then(writeDotDirectory).then(runEsBuild);
};

async function runHttpServer() {
  console.log('Starting server...');
  return await new Promise((resolve) => {
    try {
      const server = httpServer.createServer({
        root: path.resolve(cwd, 'public'),
      });

      server.listen(8080, () => {
        console.log('Server running at http://localhost:8080/');
        resolve();
      });
    } catch (error) {
      console.error('❌ Error starting server:', error);
      reject(error);
    }
  });
}

module.exports.dev = () => {
  const runThrottledBuild = throttle(
    () => {
      console.log('👀 Files changed.');
      runEsBuild();
    },
    250,
    {
      leading: false,
      trailing: true,
    },
  );

  runHttpServer().then(async () => {
    const watcher = fsPromises.watch(path.resolve(cwd, 'src'), {
      recursive: true,
    });

    console.log('Watching for changes...');

    for await (const _ of watcher) {
      runThrottledBuild();
    }
  });
};

module.exports.clean = () => {
  if (fs.existsSync(dotDirectory)) {
    fs.rmSync(dotDirectory, { recursive: true });
  }

  const cacheFilePath = path.resolve(cwd, 'public', 'cache.json');
  if (fs.existsSync(cacheFilePath)) {
    fs.rmSync(path.resolve(cacheFilePath));
  }

  const staticFilePath = path.resolve(cwd, 'public', 'static.json');
  if (fs.existsSync(staticFilePath)) {
    fs.rmSync(path.resolve(staticFilePath));
  }

  const installFilePath = path.resolve(cwd, 'public', 'install.js');
  if (fs.existsSync(installFilePath)) {
    fs.rmSync(path.resolve(installFilePath));
  }

  const serviceWorkerFilePath = path.resolve(
    cwd,
    'public',
    'service-worker.js',
  );
  if (fs.existsSync(serviceWorkerFilePath)) {
    fs.rmSync(path.resolve(serviceWorkerFilePath));
  }

  const windowFilePath = path.resolve(cwd, 'public', 'window.js');
  if (fs.existsSync(windowFilePath)) {
    fs.rmSync(path.resolve(windowFilePath));
  }

  const windowCssFilePath = path.resolve(cwd, 'public', 'window.css');
  if (fs.existsSync(windowCssFilePath)) {
    fs.rmSync(path.resolve(windowCssFilePath));
  }

  console.log('✅ Removed ewr built files!');
};

if (process.argv[2]) {
  if (process.argv[2] === 'build') {
    module.exports.build();
  } else if (process.argv[2] === 'dev') {
    module.exports.dev();
  } else if (process.argv[2] === 'clean') {
    module.exports.clean();
  }
}
