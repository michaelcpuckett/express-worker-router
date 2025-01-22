const cwd = process.cwd();
const path = require('path');

module.exports.cwd = cwd;
module.exports.dotDirectory = path.resolve(cwd, '.swarf');
module.exports.publicDirectory = path.resolve(cwd, 'public');
module.exports.srcDirectory = path.resolve(cwd, 'src');
module.exports.appDirectory = path.resolve(module.exports.srcDirectory, 'app');
module.exports.serviceWorkerDirectory = path.resolve(
  module.exports.dotDirectory,
  'service-worker',
);
module.exports.windowDirectory = path.resolve(
  module.exports.dotDirectory,
  'window',
);
