/**
 * Production-ready console logger with formatted prefixes and timestamps.
 */
const formatMessage = (level, message, meta = '') => {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level}] ${message}${metaStr}`;
};

export const logger = {
  info: (message, meta) => {
    console.log(`\x1b[36m${formatMessage('INFO', message, meta)}\x1b[0m`);
  },
  warn: (message, meta) => {
    console.warn(`\x1b[33m${formatMessage('WARN', message, meta)}\x1b[0m`);
  },
  error: (message, meta) => {
    console.error(`\x1b[31m${formatMessage('ERROR', message, meta)}\x1b[0m`);
  },
  debug: (message, meta) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`\x1b[90m${formatMessage('DEBUG', message, meta)}\x1b[0m`);
    }
  },
};

export default logger;
