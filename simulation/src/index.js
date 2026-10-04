/**
 * NEURAL CITY — Core Simulation Engine Module
 * Exporting foundational simulation components for Phase 1.
 */
export { SimulationEngine } from './core/SimulationEngine.js';
export { WorldState } from './core/WorldState.js';
export { SimulationClock } from './core/SimulationClock.js';
export { StateManager } from './core/StateManager.js';
export { RandomEngine } from './core/RandomEngine.js';

export default {
  SimulationEngine: (await import('./core/SimulationEngine.js')).SimulationEngine,
  WorldState: (await import('./core/WorldState.js')).WorldState,
  SimulationClock: (await import('./core/SimulationClock.js')).SimulationClock,
  StateManager: (await import('./core/StateManager.js')).StateManager,
  RandomEngine: (await import('./core/RandomEngine.js')).RandomEngine,
};
