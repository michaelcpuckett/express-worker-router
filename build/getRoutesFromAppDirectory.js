const fs = require('fs');
const path = require('path');
const { appDirectory } = require('./constants');

module.exports.default = function getRoutesFromAppDirectory() {
  const routes = [];

  function traverseDirectory(currentDir) {
    const files = fs.readdirSync(currentDir);

    files.forEach((file) => {
      const filePath = path.resolve(currentDir, file);

      if (fs.lstatSync(filePath).isDirectory()) {
        traverseDirectory(filePath);
      } else if (file.endsWith('.tsx')) {
        const pageName = path
          .relative(appDirectory, filePath)
          .replace(/\\/g, '/')
          .replace(/\.tsx$/, '');
        routes.push(`/${pageName}`);
      }
    });
  }

  traverseDirectory(appDirectory);

  return routes;
};
