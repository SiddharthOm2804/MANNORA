import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { ENV } from './config/env.js';
import healthRoutes from './routes/healthRoutes.js';
import worldRoutes from './routes/worldRoutes.js';
import { notFoundHandler, errorHandler } from './middleware/errorMiddleware.js';

const app = express();

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
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);

      // In development, allow localhost origins
      if (ENV.IS_DEVELOPMENT) {
        return callback(null, true);
      }

      if (origin === ENV.CLIENT_URL) {
        return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);

// HTTP request logger
app.use(morgan(ENV.IS_PRODUCTION ? 'combined' : 'dev'));

// Parse JSON request body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Root check
app.get('/', (req, res) => {
  res.json({
    name: 'NEURAL CITY API',
    description: 'AI-Driven Multi-Agent Civilization Simulation Engine',
    phase: 'Phase 3 - World Creation System',
    endpoints: {
      health: '/api/health',
      worlds: '/api/worlds',
    },
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api', healthRoutes);
app.use('/api/worlds', worldRoutes);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
