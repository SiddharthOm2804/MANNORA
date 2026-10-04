import { ENV } from '../config/env.js';

/**
 * 404 Not Found Middleware
 */
export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Central Error Handler Middleware
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    ...(ENV.IS_DEVELOPMENT && { stack: err.stack }),
    timestamp: new Date().toISOString(),
  });
};

export default {
  notFoundHandler,
  errorHandler,
};
