const fs = require('fs');
const path = require('path');
const { appDirectory, publicDirectory } = require('./constants');

module.exports.default = function copyAppDirectoryFiles() {
  const appFiles = fs.readdirSync(appDirectory).filter((file) => {
    if (fs.lstatSync(path.resolve(appDirectory, file)).isDirectory()) {
      return false;
    }

    return !file.endsWith('.tsx') && !file.endsWith('.module.css');
  });

  appFiles.forEach((file) => {
    if (file === 'index.html') {
      const source = path.resolve(appDirectory, file);
      const destination = path.resolve(publicDirectory, '404.html');

      fs.copyFileSync(source, destination);

      return;
    }

    const source = path.resolve(appDirectory, file);
    const destination = path.resolve(publicDirectory, file);

    fs.copyFileSync(source, destination);
  });

  if (!fs.existsSync(path.resolve(publicDirectory, '404.html'))) {
    const notFoundFileContent = `<!DOCTYPE html><script src="/install.js"></script>`;

    fs.writeFileSync(
      path.resolve(publicDirectory, '404.html'),
      notFoundFileContent,
    );
  }
};
