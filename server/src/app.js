import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { ENV } from './config/env.js';
import healthRoutes from './routes/healthRoutes.js';
import worldRoutes from './routes/worldRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { notFoundHandler, errorHandler } from './middleware/errorMiddleware.js';
import { createRateLimiter, sanitizeRequestBody } from './middleware/securityMiddleware.js';

const app = express();
if (ENV.TRUST_PROXY) app.set('trust proxy', 1);

// Security HTTP headers
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ENV.CORS_ORIGINS.includes(origin)) return callback(null, true);
      callback(null, false);
    },
    credentials: true,
  })
);

// HTTP request logger
app.use(morgan(ENV.IS_PRODUCTION ? 'combined' : 'dev'));

// Parse JSON request body
app.use(express.json({ limit: '1mb', strict: true }));
app.use(express.urlencoded({ extended: false, limit: '1mb', parameterLimit: 100 }));
app.use(sanitizeRequestBody);
app.use('/api', createRateLimiter({ windowMs: 60_000, max: 180 }));
app.use('/api/ai', createRateLimiter({ windowMs: 60_000, max: 30 }));

// API Root check
app.get('/', (req, res) => {
  res.json({
    name: 'NEURAL CITY API',
    description: 'AI-Driven Multi-Agent Civilization Simulation Engine',
    phase: 'Phase 18 - Production Readiness',
    endpoints: {
      health: '/api/health',
      worlds: '/api/worlds',
    },
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api', healthRoutes);
app.use('/api/auth/register', createRateLimiter({ windowMs: 15 * 60_000, max: 10 }));
app.use('/api/auth/login', createRateLimiter({ windowMs: 15 * 60_000, max: 10 }));
app.use('/api/auth', authRoutes);
app.use('/api/worlds', worldRoutes);
app.use('/api/ai', aiRoutes);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
