import mongoose from 'mongoose';
import { ENV } from './env.js';

let dbStatus = {
  status: 'uninitialized', // 'uninitialized' | 'connecting' | 'connected' | 'disconnected' | 'error'
  lastError: null,
  connectedAt: null,
  host: null,
  name: null,
};

const mapReadyState = (state) => {
  switch (state) {
    case 0:
      return 'disconnected';
    case 1:
      return 'connected';
    case 2:
      return 'connecting';
    case 3:
      return 'disconnecting';
    default:
      return 'unknown';
  }
};

/**
 * Reusable MongoDB connection function with Mongoose.
 * Validates MONGO_URI from environment, establishes connection,
 * binds lifecycle events, and handles failure gracefully without
 * masking unavailable database state.
 *
 * @param {Object} [options]
 * @param {string} [options.uri] - Optional URI override (defaults to ENV.MONGO_URI)
 * @param {boolean} [options.exitOnError=false] - Whether process should exit on fatal connect error
 * @returns {Promise<mongoose.Connection | null>}
 */
export const connectDB = async (options = {}) => {
  const { uri = ENV.MONGO_URI, exitOnError = false } = options;

  if (!uri) {
    const errorMsg = 'CRITICAL: MONGO_URI is not defined in environment variables. Database connection aborted.';
    console.error(`\x1b[31m[MongoDB Error]\x1b[0m ${errorMsg}`);
    dbStatus.status = 'error';
    dbStatus.lastError = errorMsg;

    if (exitOnError) {
      console.error('\x1b[31m[MongoDB]\x1b[0m Exiting process due to missing MONGO_URI.');
      process.exit(1);
    }
    return null;
  }

  try {
    dbStatus.status = 'connecting';
    console.log(`\x1b[36m[MongoDB]\x1b[0m Initiating connection...`);

    // Configure mongoose settings
    mongoose.set('strictQuery', true);

    // Bind event listeners once
    if (mongoose.connection.listenerCount('connected') === 0) {
      mongoose.connection.on('connected', () => {
        dbStatus.status = 'connected';
        dbStatus.lastError = null;
        dbStatus.connectedAt = new Date().toISOString();
        dbStatus.host = mongoose.connection.host;
        dbStatus.name = mongoose.connection.name;
        console.log(`\x1b[32m[MongoDB Connected]\x1b[0m Host: ${mongoose.connection.host}, Database: ${mongoose.connection.name}`);
      });

      mongoose.connection.on('error', (err) => {
        dbStatus.status = 'error';
        dbStatus.lastError = err.message;
        console.error(`\x1b[31m[MongoDB Runtime Error]\x1b[0m ${err.message}`);
      });

      mongoose.connection.on('disconnected', () => {
        dbStatus.status = 'disconnected';
        console.warn(`\x1b[33m[MongoDB Disconnected]\x1b[0m Lost connection to database.`);
      });

      mongoose.connection.on('reconnected', () => {
        dbStatus.status = 'connected';
        dbStatus.lastError = null;
        console.log(`\x1b[32m[MongoDB Reconnected]\x1b[0m Database connection restored.`);
      });
    }

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });

    dbStatus.status = 'connected';
    dbStatus.lastError = null;
    dbStatus.connectedAt = new Date().toISOString();
    dbStatus.host = conn.connection.host;
    dbStatus.name = conn.connection.name;

    return conn.connection;
  } catch (error) {
    dbStatus.status = 'error';
    dbStatus.lastError = error.message;

    console.error('\n======================================================');
    console.error('\x1b[31m[MongoDB Connection Failure]\x1b[0m Unable to connect to MongoDB!');
    console.error(`Message: ${error.message}`);
    console.error('Target URI: ' + (uri ? uri.replace(/:([^:@]+)@/, ':****@') : 'undefined'));
    console.error('\x1b[33mWARNING: Server is operating with database UNAVAILABLE.\x1b[0m');
    console.error('Check your MongoDB instance or update MONGO_URI in .env.');
    console.error('======================================================\n');

    if (exitOnError) {
      console.error('\x1b[31m[MongoDB]\x1b[0m Exiting process due to connection failure.');
      process.exit(1);
    }

    return null;
  }
};

/**
 * Gracefully close the MongoDB connection.
 * @returns {Promise<void>}
 */
export const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    dbStatus.status = 'disconnected';
    console.log('\x1b[33m[MongoDB]\x1b[0m Connection closed gracefully.');
  } catch (error) {
    console.error(`\x1b[31m[MongoDB Close Error]\x1b[0m ${error.message}`);
  }
};

/**
 * Returns current database health and connection status.
 * @returns {{
 *   isConnected: boolean,
 *   status: string,
 *   readyState: number,
 *   readyStateText: string,
 *   host: string | null,
 *   database: string | null,
 *   lastError: string | null,
 *   connectedAt: string | null
 * }}
 */
export const getDbStatus = () => {
  const readyState = mongoose.connection.readyState;
  const isConnected = readyState === 1;

  return {
    isConnected,
    status: isConnected ? 'connected' : (dbStatus.status === 'error' ? 'error' : mapReadyState(readyState)),
    readyState,
    readyStateText: mapReadyState(readyState),
    host: isConnected ? mongoose.connection.host : null,
    database: isConnected ? mongoose.connection.name : null,
    lastError: dbStatus.lastError,
    connectedAt: dbStatus.connectedAt,
  };
};

export default {
  connectDB,
  disconnectDB,
  getDbStatus,
};
