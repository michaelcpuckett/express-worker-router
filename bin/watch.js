const { exec } = require('child_process');

const watchScript = exec(`parcel watch`, {
  cwd: "./node_modules/.bin"
}, (error) => {
  if (error) {
    console.error(`❌ Error building project: ${error}`);
    return;
  }

  console.log(`✅ Project built successfully!`);
});

const serveScript = exec('http-server public -p 8080', {
  cwd: "./node_modules/.bin"
}, (error) => {
  if (error) {
    console.error(`❌ Error starting server: ${error}`);
    return;
  }

  console.log(`✅ Server started successfully!`);
});

serveScript.stdout?.pipe(process.stdout);
watchScript.stdout?.pipe(process.stdout);

watchScript.stdout?.on('error', (data) => {
  serveScript.kill();
  throw new Error('Build failed');
});

serveScript.stdout?.on('error', (data) => {
  watchScript.kill();
  throw new Error('Failed to start server');
});