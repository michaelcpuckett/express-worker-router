#!/usr/bin/env node

const { build, dev, clean, init, serve } = require('../build');
const command = process.argv[2];

if (command) {
  if (command === 'build') {
    build();
  } else if (command === 'dev') {
    dev();
  } else if (command === 'clean') {
    clean();
  } else if (command === 'init') {
    init();
  } else if (command === 'serve') {
    serve();
  } else {
    console.log('Invalid command');
  }
} else {
  console.log('Provide a command');
}
