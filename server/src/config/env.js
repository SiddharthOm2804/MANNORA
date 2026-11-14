import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try loading root .env first, then local .env if present
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

export const ENV = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGO_URI || '',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  CORS_ORIGINS: (process.env.CORS_ORIGINS || process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((value) => value.trim()).filter(Boolean),
  TRUST_PROXY: process.env.TRUST_PROXY === 'true',
  COOKIE_SAME_SITE: process.env.COOKIE_SAME_SITE || 'lax',
  IS_PRODUCTION: (process.env.NODE_ENV || 'development') === 'production',
  IS_DEVELOPMENT: (process.env.NODE_ENV || 'development') === 'development',
};

export const validateEnv = () => {
  const missing = [];
  if (ENV.IS_PRODUCTION && !ENV.MONGO_URI) {
    missing.push('MONGO_URI');
  }
  for (const origin of ENV.CORS_ORIGINS) {
    try { new URL(origin); } catch { missing.push('CORS_ORIGINS must contain valid origins'); break; }
  }
  if (!['lax', 'strict', 'none'].includes(ENV.COOKIE_SAME_SITE.toLowerCase())) missing.push('COOKIE_SAME_SITE must be lax, strict, or none');
  return {
    isValid: missing.length === 0,
    missing,
  };
};

export default ENV;
