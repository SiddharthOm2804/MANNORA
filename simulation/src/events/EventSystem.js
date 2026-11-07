import { EventEngine } from './EventEngine.js';
import { EventQueue } from './EventQueue.js';
import { EVENT_TYPES, EVENT_DEFINITIONS, EVENT_SEVERITY, EVENT_CATEGORIES } from './EventTypes.js';

/**
 * EventSystem maintains backward-compatible pipeline execution
 * while delegating full event lifecycle management to the Phase 11 EventEngine.
 */
export class EventSystem {
  /**
   * @param {Object} [options]
   */
  constructor(options = {}) {
    this.eventEngine = new EventEngine(options);
    this.catalog = Array.from(this.eventEngine.catalog.values());
  }

  /**
   * Pipeline step: delegates directly to EventEngine.update()
   * @param {import('../core/WorldState.js').WorldState} worldState
   * @param {number} delta
   * @param {import('../core/RandomEngine.js').RandomEngine} random
   * @param {Object} [clockInfo]
   */
  update(worldState, delta, random, clockInfo = {}) {
    this.eventEngine.update(worldState, delta, random, clockInfo);
  }

  /**
   * Trigger an event into active world state
   * @param {import('../core/WorldState.js').WorldState} worldState
   * @param {Object} eventData
   */
  triggerEvent(worldState, eventData) {
    return this.eventEngine.injectEvent(worldState, eventData);
  }

  /**
   * Aggregate all active event modifiers
   * @param {import('../core/WorldState.js').WorldState} worldState
   * @returns {Object}
   */
  static getAggregateModifiers(worldState) {
    return EventEngine.getAggregateModifiers(worldState);
  }
}

export { EventEngine, EventQueue, EVENT_TYPES, EVENT_DEFINITIONS, EVENT_SEVERITY, EVENT_CATEGORIES };
export default EventSystem;
