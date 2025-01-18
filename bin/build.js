const fs = require('fs');
const path = require('path');
const { Parcel } = require('@parcel/core');

const cwd = process.cwd();

console.log({
  cwd,
  __dirname,
});

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

function writeAppRoutesToFile() {
  try {
    const routes = getAppRoutes();
    const outputPath = path.resolve(cwd, './.app-router', 'routes.ts');

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
  return fs.readdirSync(path.resolve(cwd, 'public')).map((file) => {
    return '/' + file;
  });
}

function writeStaticFilesToFile() {
  try {
    const staticFiles = getStaticFiles();
    const outputPath = path.resolve(cwd, './.app-router', 'static.json');

    fs.writeFileSync(outputPath, JSON.stringify(staticFiles, null, 2));

    console.log(`✅ Static files generated successfully! See ${outputPath}`);
  } catch (error) {
    console.error('❌ Error generating static files:', error);
  }
}

(async () => {
  try {
    writeAppRoutesToFile();
    writeStaticFilesToFile();

    const relativeDirectoryPath = path.resolve(__dirname, '../');
    const relativeConfigPath = path.relative(
      cwd,
      path.resolve(relativeDirectoryPath, '.parcelrc'),
    );
    const relativePublicPath = path.relative(
      cwd,
      path.resolve(cwd, './public'),
    );

    const bundler = new Parcel({
      entries: [relativeDirectoryPath],
      config: relativeConfigPath,
      mode: 'production',
      targets: {
        app: {
          outputFormat: 'commonjs',
          sourceMap: false,
          distDir: relativePublicPath,
          distEntry: 'app.js',
          context: 'service-worker',
        },
        client: {
          outputFormat: 'commonjs',
          sourceMap: false,
          distDir: relativePublicPath,
          distEntry: 'client.js',
          context: 'browser',
        },
      },
      additionalReporters: [
        {
          packageName: '@parcel/reporter-cli',
          resolveFrom: cwd,
        },
      ],
    });

    const { bundleGraph, buildTime } = await bundler.run();
    const bundles = bundleGraph.getBundles();
    console.log(`✨ Built ${bundles.length} bundles in ${buildTime}ms!`);
  } catch (error) {
    console.error('❌ Error building project:', error);
  }
})();
