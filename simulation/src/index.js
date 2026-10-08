/**
 * NEURAL CITY — Core Deterministic Simulation Engine Module
 * Exporting foundational simulation components for Phase 4.
 */

// Core Components
export { SimulationEngine } from './core/SimulationEngine.js';
export { WorldState } from './core/WorldState.js';
export { SimulationClock } from './core/SimulationClock.js';
export { StateManager } from './core/StateManager.js';
export { RandomEngine } from './core/RandomEngine.js';

// Modular Subsystems
export { EventSystem } from './events/EventSystem.js';
export { AgentSystem } from './agents/AgentSystem.js';
export { EconomySystem } from './economy/EconomySystem.js';
export { ResourceSystem } from './resources/ResourceSystem.js';
export { PopulationSystem } from './society/PopulationSystem.js';
export { BuildingSystem } from './buildings/BuildingSystem.js';
export { MetricsSystem } from './metrics/MetricsSystem.js';

// Headless Runner
export { runHeadlessSimulation } from './cli.js';

export default {
  SimulationEngine: (await import('./core/SimulationEngine.js')).SimulationEngine,
  WorldState: (await import('./core/WorldState.js')).WorldState,
  SimulationClock: (await import('./core/SimulationClock.js')).SimulationClock,
  StateManager: (await import('./core/StateManager.js')).StateManager,
  RandomEngine: (await import('./core/RandomEngine.js')).RandomEngine,
  EventSystem: (await import('./events/EventSystem.js')).EventSystem,
  AgentSystem: (await import('./agents/AgentSystem.js')).AgentSystem,
  EconomySystem: (await import('./economy/EconomySystem.js')).EconomySystem,
  ResourceSystem: (await import('./resources/ResourceSystem.js')).ResourceSystem,
  PopulationSystem: (await import('./society/PopulationSystem.js')).PopulationSystem,
  BuildingSystem: (await import('./buildings/BuildingSystem.js')).BuildingSystem,
  MetricsSystem: (await import('./metrics/MetricsSystem.js')).MetricsSystem,
};
