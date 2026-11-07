/**
 * EventQueue manages the prioritized scheduling, dispatch, execution,
 * and chronological archival of simulation events in NEURAL CITY.
 *
 * Implements deterministic ordering by (priority DESC, triggerTick ASC, timestamp ASC, id ASC).
 */
export class EventQueue {
  /**
   * @param {Object} [options]
   * @param {number} [options.maxHistory=100]
   */
  constructor(options = {}) {
    this.maxHistory = options.maxHistory || 100;
    /** @type {Array<Object>} Queued / Scheduled events awaiting execution */
    this.queue = [];
    /** @type {Array<Object>} Historical log of executed or expired events */
    this.history = [];
  }

  /**
   * Enqueue a new event to be processed at triggerTick.
   *
   * @param {Object} event
   * @param {string} event.id
   * @param {string} event.type
   * @param {number} event.triggerTick
   * @param {number} [event.priority=1] - Higher priority executed first when ticks match
   * @param {number} [event.severity=1]
   * @param {Array<string>} [event.affectedEntities=[]]
   * @param {string} [event.cause]
   * @param {Object} [event.effects]
   * @param {number} [event.duration=10]
   * @param {string} [event.recoveryBehavior]
   * @returns {Object} Enqueued event
   */
  enqueue(event) {
    if (!event || !event.id) {
      throw new Error('EventQueue.enqueue: Event must have an id');
    }

    const normalized = {
      id: String(event.id),
      type: event.type || 'generic',
      title: event.title || event.type,
      category: event.category || 'general',
      severity: Number(event.severity ?? 1),
      priority: Number(event.priority ?? event.severity ?? 1),
      triggerTick: Number(event.triggerTick ?? 0),
      duration: Math.max(1, Number(event.duration ?? 10)),
      remainingTicks: Math.max(1, Number(event.duration ?? 10)),
      cause: event.cause || 'Manual or stochastic trigger',
      effects: event.effects || {},
      affectedEntities: Array.isArray(event.affectedEntities) ? [...event.affectedEntities] : [],
      recoveryBehavior: event.recoveryBehavior || 'GRADUAL_RESTORATION',
      timestamp: event.timestamp || new Date().toISOString(),
      source: event.source || 'SYSTEM', // 'USER_INJECTION' | 'SIMULATION_DETERMINISTIC' | 'SYSTEM'
      status: 'QUEUED',
    };

    this.queue.push(normalized);
    this._sortQueue();
    return normalized;
  }

  /**
   * Sort queue deterministically:
   * 1. triggerTick ascending (earliest first)
   * 2. priority descending (highest priority first)
   * 3. id ascending (deterministic tie-breaking)
   * @private
   */
  _sortQueue() {
    this.queue.sort((a, b) => {
      if (a.triggerTick !== b.triggerTick) {
        return a.triggerTick - b.triggerTick;
      }
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      return a.id.localeCompare(b.id);
    });
  }

  /**
   * Peek next upcoming event in queue without removing.
   * @returns {Object|null}
   */
  peek() {
    return this.queue[0] || null;
  }

  /**
   * Dequeue and return all events ready to execute at or before currentTick.
   * @param {number} currentTick
   * @returns {Array<Object>}
   */
  pollReady(currentTick) {
    const ready = [];
    const remaining = [];

    for (const evt of this.queue) {
      if (evt.triggerTick <= currentTick) {
        evt.status = 'ACTIVE';
        ready.push(evt);
      } else {
        remaining.push(evt);
      }
    }

    this.queue = remaining;
    return ready;
  }

  /**
   * Remove an event from the queue by ID before it executes.
   * @param {string} eventId
   * @returns {boolean}
   */
  cancel(eventId) {
    const idx = this.queue.findIndex((e) => e.id === eventId);
    if (idx !== -1) {
      const [removed] = this.queue.splice(idx, 1);
      removed.status = 'CANCELLED';
      this.recordHistory(removed);
      return true;
    }
    return false;
  }

  /**
   * Record completed, expired, or cancelled event in history.
   * @param {Object} eventRecord
   */
  recordHistory(eventRecord) {
    this.history.push({
      ...eventRecord,
      archivedAt: new Date().toISOString(),
    });

    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  /**
   * Get all queued events.
   * @returns {Array<Object>}
   */
  getQueued() {
    return [...this.queue];
  }

  /**
   * Get history log.
   * @returns {Array<Object>}
   */
  getHistory() {
    return [...this.history];
  }

  /**
   * Number of items currently queued.
   */
  get size() {
    return this.queue.length;
  }

  /**
   * Clear all queued events and history.
   */
  clear() {
    this.queue = [];
    this.history = [];
  }
}

export default EventQueue;

