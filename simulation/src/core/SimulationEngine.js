import { EventEmitter } from 'events';
import { SimulationClock } from './SimulationClock.js';
import { WorldState } from './WorldState.js';
import { StateManager } from './StateManager.js';
import { RandomEngine } from './RandomEngine.js';

/**
 * SimulationEngine is the central coordinator of NEURAL CITY's civilization simulation.
 * Manages deterministic stepping, state commits, clock cycles, and modular subsystem hooks.
 */
export class SimulationEngine extends EventEmitter {
  /**
   * @param {Object} [config]
   * @param {number|string} [config.seed] - Seed for deterministic random generation
   * @param {number} [config.tickRate=10] - Ticks per second
   * @param {number} [config.timeScale=1.0] - Time multiplier
   * @param {number} [config.maxHistory=100] - Snapshot history capacity
   * @param {Object} [config.worldConfig] - Initial world state configuration
   */
  constructor(config = {}) {
    super();

    this.config = {
      seed: config.seed || 123456789,
      tickRate: config.tickRate || 10,
      timeScale: config.timeScale || 1.0,
      maxHistory: config.maxHistory || 100,
      ...config,
    };

    // Subsystem components
    this.random = new RandomEngine(this.config.seed);
    this.clock = new SimulationClock({
      tickRate: this.config.tickRate,
      timeScale: this.config.timeScale,
    });
    this.stateManager = new StateManager({
      maxHistory: this.config.maxHistory,
    });

    /** @type {Map<string, { name: string, priority: number, update: Function }>} */
    this.subsystems = new Map();

    this.isInitialized = false;
  }

  /**
   * Initialize or reconfigure the simulation world
   * @param {Object} [worldConfig]
   */
  init(worldConfig = {}) {
    const initialState = new WorldState({
      tick: 0,
      metadata: {
        seed: this.random.getSeed(),
        ...(worldConfig.metadata || {}),
      },
      dimensions: worldConfig.dimensions || { width: 100, height: 100 },
      metrics: worldConfig.metrics || {},
    });

    this.clock.reset();
    this.stateManager.clearHistory();
    this.stateManager.commit(initialState);
    this.isInitialized = true;

    this.emit('init', {
      tick: 0,
      state: this.stateManager.getCurrentState().serialize(),
    });

    return this.getStatus();
  }

  /**
   * Register a modular subsystem update hook
   * @param {string} name - Subsystem name
   * @param {Function} updateFn - Function receiving (worldState, delta, random)
   * @param {number} [priority=100] - Lower numbers execute first
   */
  registerSystem(name, updateFn, priority = 100) {
    if (typeof updateFn !== 'function') {
      throw new TypeError(`System update must be a function for "${name}"`);
    }

    this.subsystems.set(name, {
      name,
      priority,
      update: updateFn,
    });
  }

  /**
   * Unregister a subsystem
   * @param {string} name
   */
  unregisterSystem(name) {
    this.subsystems.delete(name);
  }

  /**
   * Deterministically advance the simulation by one tick
   * @returns {WorldState}
   */
  step() {
    if (!this.isInitialized) {
      this.init();
    }

    // 1. Advance clock
    const { tick, delta, simulatedTime } = this.clock.tick();

    // 2. Clone current state for deterministic update
    const nextState = this.stateManager.getCurrentState().clone();
    nextState.tick = tick;

    // 3. Execute registered subsystems sorted by priority
    const sortedSystems = Array.from(this.subsystems.values()).sort(
      (a, b) => a.priority - b.priority
    );

    for (const system of sortedSystems) {
      try {
        system.update(nextState, delta, this.random);
      } catch (err) {
        this.emit('error', {
          system: system.name,
          tick,
          error: err,
        });
      }
    }

    // 4. Commit updated state to state history
    this.stateManager.commit(nextState);

    // 5. Emit tick event
    this.emit('tick', {
      tick,
      delta,
      simulatedTime,
      state: nextState.serialize(),
    });

    return nextState;
  }

  /**
   * Start automated continuous ticking
   */
  start() {
    if (!this.isInitialized) {
      this.init();
    }

    this.clock.start(() => {
      this.step();
    });

    this.emit('start', this.getStatus());
  }

  /**
   * Pause automated continuous ticking
   */
  pause() {
    this.clock.pause();
    this.emit('pause', this.getStatus());
  }

  /**
   * Resume ticking if paused
   */
  resume() {
    this.clock.resume();
    this.emit('resume', this.getStatus());
  }

  /**
   * Stop simulation loop
   */
  stop() {
    this.clock.stop();
    this.emit('stop', this.getStatus());
  }

  /**
   * Reset simulation state back to tick 0
   */
  reset() {
    this.clock.reset();
    this.random.reset();
    this.init();
    this.emit('reset', this.getStatus());
  }

  /**
   * Rollback to a specific tick snapshot
   * @param {number} tick
   */
  rollback(tick) {
    const rolledBackState = this.stateManager.rollback(tick);
    this.clock.currentTick = rolledBackState.tick;
    this.clock.elapsedSimulatedTime = rolledBackState.tick * this.clock.fixedDelta;
    this.emit('rollback', {
      tick,
      state: rolledBackState.serialize(),
    });
    return rolledBackState;
  }

  /**
   * Get comprehensive status of the simulation engine
   */
  getStatus() {
    const clockStatus = this.clock.getStatus();
    const currentState = this.stateManager.getCurrentState();

    return {
      isInitialized: this.isInitialized,
      clock: clockStatus,
      seed: this.random.getSeed(),
      activeSubsystems: Array.from(this.subsystems.keys()),
      stateSummary: {
        tick: currentState.tick,
        entitiesCount: currentState.getEntityCount(),
        metrics: currentState.getMetrics(),
        history: this.stateManager.getHistorySummary(),
      },
    };
  }
}

export default SimulationEngine;
