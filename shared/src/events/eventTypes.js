/**
 * Canonical Event Types across NEURAL CITY Client, Server, and Engine.
 */
export const EVENT_TYPES = {
  // Engine Lifecycle Events
  ENGINE_INIT: 'engine:init',
  ENGINE_START: 'engine:start',
  ENGINE_PAUSE: 'engine:pause',
  ENGINE_RESUME: 'engine:resume',
  ENGINE_STOP: 'engine:stop',
  ENGINE_RESET: 'engine:reset',
  ENGINE_TICK: 'engine:tick',
  ENGINE_ROLLBACK: 'engine:rollback',
  ENGINE_ERROR: 'engine:error',

  // System Health Events
  HEALTH_CHECK: 'system:health_check',
  DB_CONNECTED: 'db:connected',
  DB_DISCONNECTED: 'db:disconnected',
  DB_ERROR: 'db:error',
};

export default EVENT_TYPES;
