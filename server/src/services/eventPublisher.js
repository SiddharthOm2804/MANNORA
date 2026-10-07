import { EventEmitter } from 'events';

/**
 * EventPublisher manages real-time event broadcasting and subscriptions
 * for simulation updates, ticks, state changes, and telemetry streams.
 * Decoupled from transport layer (SSE, WebSockets, or Worker messages).
 */
export class EventPublisher extends EventEmitter {
  constructor() {
    super();
    // Maximum listeners to avoid Node warning when many clients connect
    this.setMaxListeners(500);
    /** @type {Map<string, Set<Function>>} */
    this.worldSubscribers = new Map();
  }

  /**
   * Format standardized event payload
   * @param {string} worldId
   * @param {Object} event
   * @returns {Object}
   */
  formatEvent(worldId, event = {}) {
    return {
      type: event.type || 'SIMULATION_EVENT',
      timestamp: event.timestamp || new Date().toISOString(),
      worldId: String(worldId),
      tick: typeof event.tick === 'number' ? event.tick : 0,
      payload: event.payload || {},
    };
  }

  /**
   * Subscribe a listener function to real-time events for a specific world.
   * @param {string} worldId
   * @param {Function} listener
   * @returns {Function} Unsubscribe function
   */
  subscribe(worldId, listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('Listener must be a function');
    }

    const key = String(worldId);
    if (!this.worldSubscribers.has(key)) {
      this.worldSubscribers.set(key, new Set());
    }

    this.worldSubscribers.get(key).add(listener);

    // Return cleanup / unsubscribe callback
    return () => {
      const listeners = this.worldSubscribers.get(key);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          this.worldSubscribers.delete(key);
        }
      }
    };
  }

  /**
   * Publish a standardized event to all active subscribers for a specific world.
   * @param {string} worldId
   * @param {Object} eventData
   * @returns {Object} Standardized event that was emitted
   */
  publish(worldId, eventData) {
    const formatted = this.formatEvent(worldId, eventData);
    const key = String(worldId);

    const listeners = this.worldSubscribers.get(key);
    if (listeners && listeners.size > 0) {
      for (const listener of listeners) {
        try {
          listener(formatted);
        } catch (err) {
          console.error(`[EventPublisher] Error dispatching event to subscriber for world ${key}:`, err);
        }
      }
    }

    // Also emit globally for server-level listeners / tests
    this.emit(`world:${key}`, formatted);
    this.emit('event', formatted);

    return formatted;
  }

  /**
   * Publish an event to all connected subscribers across all worlds.
   * @param {Object} eventData
   */
  broadcast(eventData) {
    for (const worldId of this.worldSubscribers.keys()) {
      this.publish(worldId, eventData);
    }
  }

  /**
   * Get active subscriber count for a world
   * @param {string} worldId
   * @returns {number}
   */
  getSubscriberCount(worldId) {
    const key = String(worldId);
    return this.worldSubscribers.get(key)?.size || 0;
  }

  /**
   * Bind a SimulationEngine instance to automatically publish simulation lifecycle and tick events.
   * @param {string} worldId
   * @param {import('events').EventEmitter} engine - Instance of SimulationEngine
   * @returns {Function} Unbind function
   */
  bindSimulationEngine(worldId, engine) {
    if (!engine || typeof engine.on !== 'function') {
      throw new TypeError('Valid SimulationEngine EventEmitter instance required');
    }

    const onTick = (data) => {
      this.publish(worldId, {
        type: 'TICK',
        tick: data.tick,
        payload: {
          delta: data.delta,
          simulatedTime: data.simulatedTime,
          state: data.state,
        },
      });
    };

    const onStatusChange = (statusType) => (data) => {
      this.publish(worldId, {
        type: 'STATUS_CHANGE',
        tick: data?.clock?.currentTick ?? data?.tick ?? 0,
        payload: {
          status: statusType,
          statusDetails: data,
        },
      });
    };

    const onError = (errorData) => {
      this.publish(worldId, {
        type: 'SIMULATION_EVENT',
        tick: errorData.tick || 0,
        payload: {
          level: 'error',
          subsystem: errorData.system,
          message: errorData.error?.message || String(errorData.error),
        },
      });
    };

    const onInit = onStatusChange('initialized');
    const onStart = onStatusChange('running');
    const onPause = onStatusChange('paused');
    const onResume = onStatusChange('running');
    const onStop = onStatusChange('stopped');
    const onReset = onStatusChange('initialized');
    const onRollback = (data) => {
      this.publish(worldId, {
        type: 'STATUS_CHANGE',
        tick: data.tick,
        payload: {
          status: 'rollback',
          targetTick: data.tick,
          state: data.state,
        },
      });
    };

    engine.on('tick', onTick);
    engine.on('init', onInit);
    engine.on('start', onStart);
    engine.on('pause', onPause);
    engine.on('resume', onResume);
    engine.on('stop', onStop);
    engine.on('reset', onReset);
    engine.on('rollback', onRollback);
    engine.on('error', onError);

    // Return unbind cleanup
    return () => {
      engine.off('tick', onTick);
      engine.off('init', onInit);
      engine.off('start', onStart);
      engine.off('pause', onPause);
      engine.off('resume', onResume);
      engine.off('stop', onStop);
      engine.off('reset', onReset);
      engine.off('rollback', onRollback);
      engine.off('error', onError);
    };
  }

  /**
   * Clear all subscribers for a specific world or globally
   * @param {string} [worldId]
   */
  clear(worldId) {
    if (worldId) {
      this.worldSubscribers.delete(String(worldId));
    } else {
      this.worldSubscribers.clear();
      this.removeAllListeners();
    }
  }
}

export const eventPublisher = new EventPublisher();
export default eventPublisher;
