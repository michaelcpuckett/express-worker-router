const fs = require('fs');
const { publicDirectory } = require('./constants');

module.exports.default = function getStaticFiles() {
  return Array.from(
    new Set([
      'service-worker.js',
      'window.js',
      ...fs.readdirSync(publicDirectory),
    ]),
  )
    .filter((file) => {
      return file !== 'service-worker.css';
    })
    .map((file) => {
      return '/' + file;
    });
};
