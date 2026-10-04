/**
 * Global Constants for NEURAL CITY
 */
export const ENGINE_CONSTANTS = {
  DEFAULT_TICK_RATE: 10, // TPS (Hz)
  MIN_TICK_RATE: 1,
  MAX_TICK_RATE: 60,
  DEFAULT_TIME_SCALE: 1.0,
  MAX_TIME_SCALE: 10.0,
  DEFAULT_WORLD_WIDTH: 100,
  DEFAULT_WORLD_HEIGHT: 100,
  MAX_HISTORY_SNAPSHOTS: 100,
};

export const SYSTEM_STATUS = {
  HEALTHY: 'healthy',
  DEGRADED: 'degraded',
  DOWN: 'down',
};

export const DB_STATUS = {
  DISCONNECTED: 'disconnected',
  CONNECTED: 'connected',
  CONNECTING: 'connecting',
  DISCONNECTING: 'disconnecting',
  ERROR: 'error',
};

export default {
  ENGINE_CONSTANTS,
  SYSTEM_STATUS,
  DB_STATUS,
};
