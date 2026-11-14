import { ENV } from '../config/env.js';

/**
 * 404 Not Found Middleware
 */
export const notFoundHandler = (req, res, next) => {
  const error = new Error('Not Found');
  res.status(404);
  next(error);
};

/**
 * Central Error Handler Middleware
 */
export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: 'Request body exceeds the 1 MB limit.' });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Request body contains invalid JSON.' });
  }
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  if (statusCode >= 500) console.error('[Request Error]', req.method, req.originalUrl, err);
  res.status(statusCode).json({
    status: 'error',
    message: statusCode >= 500 && ENV.IS_PRODUCTION ? 'Internal Server Error' : (err.message || 'Internal Server Error'),
    ...(ENV.IS_DEVELOPMENT && { stack: err.stack }),
    timestamp: new Date().toISOString(),
  });
};

export default {
  notFoundHandler,
  errorHandler,
};
