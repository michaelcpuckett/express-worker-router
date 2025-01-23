const fs = require('fs');
const fsPromises = require('node:fs/promises');
const throttle = require('lodash.throttle');
const { publicDirectory, srcDirectory, dotDirectory } = require('./constants');
const writePublicDirectory = require('./writePublicDirectory').default;
const writeDotDirectory = require('./writeDotDirectory').default;
const copyAppDirectoryFiles = require('./copyAppDirectoryFiles').default;
const writeStaticAssetsFile = require('./writeStaticAssetsFile').default;
const writeAppDirectory = require('./writeAppDirectory').default;
const writeTypeDefinitionFile = require('./writeTypeDefinitionFile').default;
const runEsBuild = require('./runEsBuild').default;
const runHttpServer = require('./runHttpServer').default;

module.exports.build = () => {
  writePublicDirectory()
    .then(writeDotDirectory)
    .then(() => {
      copyAppDirectoryFiles();
      writeStaticAssetsFile();
      runEsBuild();
    });
};

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
    const watcher = fsPromises.watch(srcDirectory, {
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

  if (fs.existsSync(publicDirectory)) {
    fs.rmSync(publicDirectory, { recursive: true });
  }

  console.log('✅ Removed built files!');
};

module.exports.init = () => {
  writeAppDirectory();
  writeTypeDefinitionFile();

  console.log('✅ Initialized project!');
};

module.exports.serve = () => {
  runHttpServer();
};
