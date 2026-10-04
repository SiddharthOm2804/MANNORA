import app from './app.js';
import { ENV, validateEnv } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';

const startServer = async () => {
  console.log('\x1b[35m' + '='.repeat(60) + '\x1b[0m');
  console.log('\x1b[1m\x1b[36m   NEURAL CITY — Civilization Simulation Engine Server\x1b[0m');
  console.log('\x1b[90m   Phase 1: Foundational Architecture & Environment Setup\x1b[0m');
  console.log('\x1b[35m' + '='.repeat(60) + '\x1b[0m\n');

  // Validate environment configuration
  const validation = validateEnv();
  if (!validation.isValid) {
    console.warn(`\x1b[33m[Config Warning]\x1b[0m Missing env variables: ${validation.missing.join(', ')}`);
  }

  // Attempt database connection
  await connectDB();

  const server = app.listen(ENV.PORT, () => {
    console.log(`\x1b[32m[Server Online]\x1b[0m http://localhost:${ENV.PORT}`);
    console.log(`\x1b[34m[Health Check]\x1b[0m  http://localhost:${ENV.PORT}/api/health`);
    console.log(`\x1b[90m[Environment]   ${ENV.NODE_ENV}\x1b[0m\n`);
  });

  // Graceful shutdown handling
  const gracefulShutdown = async (signal) => {
    console.log(`\n\x1b[33m[Shutdown]\x1b[0m Received ${signal}. Closing server gracefully...`);
    server.close(async () => {
      console.log('\x1b[33m[Shutdown]\x1b[0m HTTP server closed.');
      await disconnectDB();
      console.log('\x1b[32m[Shutdown]\x1b[0m Process terminated cleanly.');
      process.exit(0);
    });

    // Force shutdown after timeout
    setTimeout(() => {
      console.error('\x1b[31m[Shutdown Error]\x1b[0m Forced termination due to timeout.');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  process.on('unhandledRejection', (reason, promise) => {
    console.error('\x1b[31m[Unhandled Rejection]\x1b[0m', reason);
  });

  process.on('uncaughtException', (err) => {
    console.error('\x1b[31m[Uncaught Exception]\x1b[0m', err);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
  });

  return server;
};

startServer();
