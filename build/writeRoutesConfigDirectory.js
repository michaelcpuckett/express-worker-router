const fs = require('fs');
const path = require('path');
const prettier = require('prettier');
const { dotDirectory } = require('./constants');
const tsConfig = require('./tsConfig').default;
const getRoutesFromAppDirectory =
  require('./getRoutesFromAppDirectory').default;

function toCamelCase(string) {
  return string.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

module.exports.default = async function writeRoutesConfigDirectory() {
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
      JSON.stringify(tsConfig, null, 2),
    );
    console.log(`✅ Routes generated successfully!`);
  } catch (error) {
    console.error('❌ Error generating routes:', error);
  }
};
