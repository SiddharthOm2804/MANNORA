import { Router } from 'express';
import { getDbStatus } from '../config/db.js';
import { ENV } from '../config/env.js';

const router = Router();
const startTime = Date.now();

/**
 * GET /api/health
 * Returns server and database health status, timestamp, and runtime metrics.
 */
router.get('/health', (req, res) => {
  const dbHealth = getDbStatus();
  const isHealthy = dbHealth.isConnected;

  const payload = {
    status: isHealthy ? 'healthy' : 'degraded',
    message: isHealthy 
      ? 'NEURAL CITY engine and database are operational.' 
      : 'Server is running, but database connection is unavailable.',
    timestamp: new Date().toISOString(),
    server: {
      status: 'running',
      uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
      environment: ENV.NODE_ENV,
      nodeVersion: process.version,
    },
    database: {
      status: dbHealth.status,
      isConnected: dbHealth.isConnected,
      readyState: dbHealth.readyStateText,
      host: dbHealth.host,
      database: dbHealth.database,
      lastError: dbHealth.lastError,
    },
    engine: {
      phase: 'Phase 1 - Foundational Architecture',
      version: '0.1.0',
    },
  };

  // If client passes ?strict=true, return 503 if degraded
  const statusCode = req.query.strict === 'true' && !isHealthy ? 503 : 200;
  return res.status(statusCode).json(payload);
});

export default router;
