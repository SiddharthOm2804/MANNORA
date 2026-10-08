import { EventEmitter } from 'events';
import { SimulationClock } from './SimulationClock.js';
import { WorldState } from './WorldState.js';
import { StateManager } from './StateManager.js';
import { RandomEngine } from './RandomEngine.js';

import { EventSystem } from '../events/EventSystem.js';
import { AgentSystem } from '../agents/AgentSystem.js';
import { EconomySystem } from '../economy/EconomySystem.js';
import { ResourceSystem } from '../resources/ResourceSystem.js';
import { PopulationSystem } from '../society/PopulationSystem.js';
import { BuildingSystem } from '../buildings/BuildingSystem.js';
import { MetricsSystem } from '../metrics/MetricsSystem.js';

/**
 * SimulationEngine is the central deterministic coordinator of NEURAL CITY's civilization simulation.
 * Manages deterministic stepping, state commits, clock cycles, and modular subsystem pipelines.
 *
 * Each tick executes strictly in order:
 * CLOCK → EVENTS → AGENTS → ECONOMY → RESOURCES → WORLD STATE → METRICS
 */
export class SimulationEngine extends EventEmitter {
  /**
   * @param {Object} [config]
   * @param {number|string} [config.seed] - Seed for deterministic random generation
   * @param {number} [config.tickRate=10] - Ticks per second
   * @param {number} [config.timeScale=1.0] - Time multiplier
   * @param {number} [config.ticksPerHour=1] - Ticks per simulation hour
   * @param {number} [config.hoursPerDay=24] - Simulation hours in a day
   * @param {number} [config.maxHistory=100] - Snapshot history capacity
   * @param {Object} [config.worldConfig] - Initial world state configuration
   * @param {boolean} [config.useDefaultSystems=true] - Auto-register standard pipelines
   */
  constructor(config = {}) {
    super();

    this.config = {
      seed: config.seed ?? 123456789,
      tickRate: config.tickRate || 10,
      timeScale: config.timeScale || 1.0,
      ticksPerHour: config.ticksPerHour || 1,
      hoursPerDay: config.hoursPerDay || 24,
      maxHistory: config.maxHistory || 100,
      useDefaultSystems: config.useDefaultSystems ?? true,
      ...config,
    };

    // Core Components
    this.random = new RandomEngine(this.config.seed);
    this.clock = new SimulationClock({
      tickRate: this.config.tickRate,
      timeScale: this.config.timeScale,
      ticksPerHour: this.config.ticksPerHour,
      hoursPerDay: this.config.hoursPerDay,
    });
    this.stateManager = new StateManager({
      maxHistory: this.config.maxHistory,
    });

    /** @type {Map<string, { name: string, priority: number, update: Function }>} */
    this.subsystems = new Map();

    // Register standard pipeline systems if enabled
    if (this.config.useDefaultSystems) {
      this._registerDefaultPipelines();
    }

    this.isInitialized = false;
  }

  /**
   * Register default pipeline subsystems in order:
   * EVENTS (10) → AGENTS (20) → ECONOMY (30) → RESOURCES (40) → WORLD STATE (50, 55) → METRICS (60)
   * @private
   */
  _registerDefaultPipelines() {
    this.eventSystem = new EventSystem();
    this.agentSystem = new AgentSystem();
    this.economySystem = new EconomySystem();
    this.resourceSystem = new ResourceSystem();
    this.populationSystem = new PopulationSystem();
    this.buildingSystem = new BuildingSystem();
    this.metricsSystem = new MetricsSystem();

    // 1. EVENTS (Priority 10)
    this.registerSystem('events', (state, delta, random, clockInfo) => {
      this.eventSystem.update(state, delta, random, clockInfo);
    }, 10);

    // 2. AGENTS (Priority 20)
    this.registerSystem('agents', (state, delta, random, clockInfo) => {
      this.agentSystem.update(state, delta, random, clockInfo);
    }, 20);

    // 3. ECONOMY (Priority 30)
    this.registerSystem('economy', (state, delta, random, clockInfo) => {
      this.economySystem.update(state, delta, random, clockInfo);
    }, 30);

    // 4. RESOURCES (Priority 40)
    this.registerSystem('resources', (state, delta, random, clockInfo) => {
      this.resourceSystem.update(state, delta, random, clockInfo);
    }, 40);

    // 5. WORLD STATE (Priority 50: Population, Priority 55: Buildings)
    this.registerSystem('population', (state, delta, random, clockInfo) => {
      this.populationSystem.update(state, delta, random, clockInfo);
    }, 50);

    this.registerSystem('buildings', (state, delta, random, clockInfo) => {
      this.buildingSystem.update(state, delta, random, clockInfo);
    }, 55);

    // 6. METRICS (Priority 60)
    this.registerSystem('metrics', (state, delta, random, clockInfo) => {
      this.metricsSystem.update(state, delta, random, clockInfo);
    }, 60);
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
      population: worldConfig.population,
      resources: worldConfig.resources,
      economy: worldConfig.economy,
      buildings: worldConfig.buildings,
      agents: worldConfig.agents,
      events: worldConfig.events,
      metrics: worldConfig.metrics,
      entities: worldConfig.entities,
    });

    this.clock.reset();
    this.stateManager.clearHistory();
    this.stateManager.commit(initialState);
    this.isInitialized = true;

    this.emit('init', {
      tick: 0,
      day: this.clock.simulationDay,
      hour: this.clock.simulationHour,
      state: this.stateManager.getCurrentState().serialize(),
    });

    return this.getStatus();
  }

  /**
   * Register a modular subsystem update hook
   * @param {string} name - Subsystem name
   * @param {Function} updateFn - Function receiving (worldState, delta, random, clockInfo)
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
   * Deterministically advance the simulation by one tick.
   *
   * Executes pipeline in order:
   * CLOCK → EVENTS → AGENTS → ECONOMY → RESOURCES → WORLD STATE → METRICS
   *
   * @returns {WorldState}
   */
  step() {
    if (!this.isInitialized) {
      this.init();
    }

    // 1. CLOCK (Advance clock)
    const clockInfo = this.clock.tick();
    const { tick, day, hour, delta, simulatedTime, dayChanged, hourChanged } = clockInfo;

    // 2. Clone current state for deterministic update
    const nextState = this.stateManager.getCurrentState().clone();
    nextState.tick = tick;

    // 3. Execute registered subsystems sorted by priority
    const sortedSystems = Array.from(this.subsystems.values()).sort(
      (a, b) => a.priority - b.priority
    );

    for (const system of sortedSystems) {
      try {
        system.update(nextState, delta, this.random, clockInfo);
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

    // 5. Emit tick and diurnal lifecycle events
    if (dayChanged) {
      this.emit('dayPassed', { tick, day, simulatedTime });
    }
    if (hourChanged) {
      this.emit('hourPassed', { tick, day, hour });
    }

    this.emit('tick', {
      tick,
      day,
      hour,
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
   * Set simulation speed multiplier
   * @param {number} multiplier
   */
  setSpeed(multiplier) {
    this.clock.setTimeScale(multiplier);
  }

  /**
   * Set simulation tick rate (Hz)
   * @param {number} rate
   */
  setTickRate(rate) {
    this.clock.setTickRate(rate);
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
      day: this.clock.simulationDay,
      hour: this.clock.simulationHour,
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
        day: this.clock.simulationDay,
        hour: this.clock.simulationHour,
        population: currentState.population.total,
        treasury: currentState.economy.treasury,
        buildingsCount: currentState.getBuildingCount(),
        agentsCount: currentState.getAgentCount(),
        entitiesCount: currentState.getEntityCount(),
        activeEventsCount: currentState.getActiveEvents().length,
        metrics: currentState.getMetrics(),
        history: this.stateManager.getHistorySummary(),
      },
    };
  }
}

export default SimulationEngine;
