import { ENV } from '../config/env.js';

const windows = new Map();
let cleanupCounter = 0;

/** Small single-process limiter. Use an edge/shared limiter when running multiple replicas. */
export const createRateLimiter = ({ windowMs = 60_000, max = 120 } = {}) => (req, res, next) => {
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  let bucket = windows.get(key);
  if (!bucket || bucket.resetAt <= now) bucket = { count: 0, resetAt: now + windowMs };
  bucket.count += 1;
  windows.set(key, bucket);
  if (++cleanupCounter >= 256 || windows.size > 10_000) {
    cleanupCounter = 0;
    for (const [entry, value] of windows) if (value.resetAt <= now) windows.delete(entry);
  }
  res.set('RateLimit-Limit', String(max));
  res.set('RateLimit-Remaining', String(Math.max(0, max - bucket.count)));
  res.set('RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));
  if (bucket.count > max) {
    res.set('Retry-After', String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))));
    return res.status(429).json({ success: false, message: 'Too many requests. Try again shortly.' });
  }
  return next();
};

const forbiddenKey = /^(?:\$|__proto__$|prototype$|constructor$)/;
const cleanValue = (value) => {
  if (Array.isArray(value)) return value.map(cleanValue);
  if (!value || typeof value !== 'object') return value;
  const clean = {};
  for (const [key, child] of Object.entries(value)) {
    if (forbiddenKey.test(key) || key.includes('.')) continue;
    clean[key] = cleanValue(child);
  }
  return clean;
};

/** Remove Mongo operator/path keys from untrusted JSON and form bodies. */
export const sanitizeRequestBody = (req, _res, next) => {
  if (req.body && typeof req.body === 'object') req.body = cleanValue(req.body);
  next();
};

export const isAllowedWebSocketOrigin = (origin) => {
  if (!origin) return !ENV.IS_PRODUCTION;
  return ENV.CORS_ORIGINS.includes(origin);
};
