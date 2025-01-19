#!/usr/bin/env node

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
const cwd = process.cwd();

makeDirectoryIfNotExists();
writeRouteConfigFile();
writeStaticAssetsFile();
copyCacheJsonFile();
runEsBuild();

function makeDirectoryIfNotExists() {
  const dir = path.resolve(cwd, '.express-worker-router');

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);

    const cacheFilePath = path.resolve(dir, 'cache.json');
    const cache = {
      version: 1,
    };

    fs.writeFileSync(cacheFilePath, JSON.stringify(cache, null, 2));
  }
}

function getAppRoutes() {
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

const toCamelCase = (string) => {
  return string.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
};

async function writeRouteConfigFile() {
  try {
    const routes = getAppRoutes();
    const outputPath = path.resolve(
      cwd,
      './.express-worker-router',
      'routes.ts',
    );

    fs.writeFileSync(
      outputPath,
      `const Routes: Record<string, any> = {};

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
    );
    console.log(`✅ Routes generated successfully! See ${outputPath}`);
  } catch (error) {
    console.error('❌ Error generating routes:', error);
  }
}

function getStaticFiles() {
  return Array.from(
    new Set([
      'service-worker.js',
      'hydration.js',
      ...fs.readdirSync(path.resolve(cwd, 'public')),
    ]),
  ).map((file) => {
    return '/' + file;
  });
}

function writeStaticAssetsFile() {
  try {
    const staticFiles = getStaticFiles();
    const outputPath = path.resolve(
      cwd,
      '.express-worker-router',
      'static.json',
    );

    fs.writeFileSync(outputPath, JSON.stringify(staticFiles, null, 2));

    console.log(`✅ Static files generated successfully! See ${outputPath}`);
  } catch (error) {
    console.error('❌ Error generating static files:', error);
  }
}

function copyCacheJsonFile() {
  try {
    const cacheFilePath = path.resolve(
      cwd,
      '.express-worker-router',
      'cache.json',
    );
    const outputPath = path.resolve(cwd, 'public', 'cache.json');

    fs.copyFileSync(cacheFilePath, outputPath);
  } catch (error) {
    console.error('❌ Error copying cache file:', error);
  }
}

async function runEsBuild() {
  try {
    const config = {
      logLevel: 'warning',
      bundle: true,
      platform: 'browser',
      target: 'es2018',
      format: 'cjs',
      sourcemap: false,
    };

    await esbuild.build({
      ...config,
      tsconfig: './service-worker/tsconfig.json',
      outfile: 'public/service-worker.js',
      entryPoints: ['./service-worker/index.ts'],
    });

    console.log('✅ Service worker file built successfully!');

    await esbuild.build({
      ...config,
      tsconfig: './hydration/tsconfig.json',
      outfile: 'public/hydration.js',
      entryPoints: ['./hydration/index.ts'],
    });

    console.log('✅ Hydration file built successfully!');
  } catch (error) {
    console.error('❌ Error building project:', error);
  }
}
