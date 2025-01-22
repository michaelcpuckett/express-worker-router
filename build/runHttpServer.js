const httpServer = require('http-server');
const { publicDirectory } = require('./constants');

module.exports.default = async function runHttpServer() {
  console.log('Starting server...');
  return await new Promise((resolve) => {
    try {
      const server = httpServer.createServer({
        root: publicDirectory,
      });

      server.listen(8080, () => {
        console.log('Server running at http://localhost:8080/');
        resolve();
      });
    } catch (error) {
      console.error('❌ Error starting server:', error);
      reject(error);
    }
  });
};
