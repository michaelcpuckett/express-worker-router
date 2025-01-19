#!/usr/bin/env node

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
const httpServer = require('http-server');
const cwd = process.cwd();

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

makeDirectoryIfNotExists();

async function serve() {
  const server = httpServer.createServer({
    root: './public',
  });

  server.listen(8080, () => {
    console.log('🚀 Server running at http://localhost:8080');
  });
}

serve();

async function build() {
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

fs.watch(
  '.',
  {
    recursive: true,
  },
  (eventType, fileName) => {
    if (fileName && (fileName.endsWith('.ts') || fileName.endsWith('.tsx'))) {
      build();
    }
  },
);

console.log('👀 Watching for changes...');
