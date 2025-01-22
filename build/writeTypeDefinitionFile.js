const fs = require('fs');
const path = require('path');
const { cwd } = require('./constants');

module.exports.default = function writeTypeDefinitionFile() {
  const typeDefinitionFileContents = `declare module '*.module.css';`;
  const typeDefinitionFilePath = path.resolve(cwd, 'swarf-env.d.ts');

  fs.writeFileSync(typeDefinitionFilePath, typeDefinitionFileContents);
};
