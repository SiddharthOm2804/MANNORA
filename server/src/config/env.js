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
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
};

export const validateEnv = () => {
  const missing = [];
  if (!ENV.MONGO_URI) {
    missing.push('MONGO_URI');
  }
  return {
    isValid: missing.length === 0,
    missing,
  };
};

export default ENV;
