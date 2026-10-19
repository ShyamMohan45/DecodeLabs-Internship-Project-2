import { app } from './app.js';
import { config } from './config/index.js';

const server = app.listen(config.port, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Project 2: Backend API Server running successfully!`);
  console.log(`📡 URL: http://localhost:${config.port}${config.apiPrefix}`);
  console.log(`🩺 Health: http://localhost:${config.port}${config.apiPrefix}/health`);
  console.log(`🌍 Environment: ${config.env}`);
  console.log(`=======================================================`);
});

const handleGracefulShutdown = (signal: string) => {
  console.log(`\n[${signal}] Received. Shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed. Exiting process.');
    process.exit(0);
  });

  // Force close after 10s if connections linger
  setTimeout(() => {
    console.error('Forcefully terminating process due to lingering connections.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
