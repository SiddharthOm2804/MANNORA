import { WorldState } from './WorldState.js';

/**
 * StateManager manages snapshots, rollbacks, state history,
 * state reads/updates, and immutable transition checkpoints for the simulation.
 */
export class StateManager {
  /**
   * @param {Object} [options]
   * @param {number} [options.maxHistory=100] - Maximum snapshots retained in memory
   * @param {number} [options.snapshotInterval=1] - Frequency of automatic state snapshots (ticks)
   */
  constructor(options = {}) {
    this.maxHistory = options.maxHistory || 100;
    this.snapshotInterval = options.snapshotInterval || 1;

    /** @type {WorldState} */
    this.currentState = new WorldState();

    /** @type {Map<number, WorldState>} */
    this.history = new Map();

    // Initial commit
    this.commit(this.currentState);
  }

  // ==================== READ STATE ====================

  /**
   * Get the current active WorldState
   * @returns {WorldState}
   */
  getCurrentState() {
    return this.currentState;
  }

  /**
   * Alias for getCurrentState
   * @returns {WorldState}
   */
  getState() {
    return this.getCurrentState();
  }

  /**
   * Retrieve snapshot for a specific tick
   * @param {number} tick
   * @returns {WorldState|null}
   */
  getSnapshot(tick) {
    const found = this.history.get(tick);
    return found ? found.clone() : null;
  }

  // ==================== UPDATE STATE ====================

  /**
   * Update the current state via a mutator function or partial object
   * @param {Function|Object} updater - Function receiving currentState or partial state object
   * @returns {WorldState}
   */
  updateState(updater) {
    if (typeof updater === 'function') {
      updater(this.currentState);
    } else if (updater && typeof updater === 'object') {
      if (updater.metrics) {
        this.currentState.updateMetrics(updater.metrics);
      }
      if (updater.population) {
        this.currentState.updatePopulation(updater.population);
      }
      if (updater.economy) {
        this.currentState.updateEconomy(updater.economy);
      }
      if (updater.dimensions) {
        this.currentState.dimensions = { ...this.currentState.dimensions, ...updater.dimensions };
      }
      if (updater.metadata) {
        this.currentState.metadata = { ...this.currentState.metadata, ...updater.metadata };
      }
    }
    return this.currentState;
  }

  /**
   * Commit a new or modified state into history
   * @param {WorldState} state
   * @returns {WorldState}
   */
  commit(state) {
    if (!(state instanceof WorldState)) {
      throw new TypeError('State must be an instance of WorldState');
    }

    this.currentState = state;

    if (state.tick % this.snapshotInterval === 0) {
      // Store cloned immutable snapshot
      this.history.set(state.tick, state.clone());

      // Prune oldest snapshots if exceeding maxHistory
      if (this.history.size > this.maxHistory) {
        const oldestTick = Math.min(...this.history.keys());
        this.history.delete(oldestTick);
      }
    }

    return this.currentState;
  }

  // ==================== SNAPSHOT STATE ====================

  /**
   * Explicitly create and store a snapshot of the current state
   * @returns {WorldState} Cloned snapshot
   */
  createSnapshot() {
    const snapshot = this.currentState.clone();
    this.history.set(snapshot.tick, snapshot);

    if (this.history.size > this.maxHistory) {
      const oldestTick = Math.min(...this.history.keys());
      this.history.delete(oldestTick);
    }

    return snapshot;
  }

  /**
   * List all stored snapshot tick numbers
   * @returns {number[]}
   */
  listSnapshots() {
    return Array.from(this.history.keys()).sort((a, b) => a - b);
  }

  /**
   * Alias for listSnapshots
   * @returns {number[]}
   */
  getHistoryTicks() {
    return this.listSnapshots();
  }

  /**
   * Get metadata summary of available history
   */
  getHistorySummary() {
    const ticks = this.getHistoryTicks();
    return {
      totalSnapshots: ticks.length,
      earliestTick: ticks.length > 0 ? ticks[0] : 0,
      latestTick: ticks.length > 0 ? ticks[ticks.length - 1] : 0,
      currentTick: this.currentState.tick,
    };
  }

  // ==================== RESTORE & ROLLBACK ====================

  /**
   * Restore state from a tick or a snapshot instance
   * @param {number|WorldState|Object} target
   * @returns {WorldState}
   */
  restoreState(target) {
    if (typeof target === 'number') {
      return this.rollback(target);
    }

    if (target instanceof WorldState) {
      this.currentState = target.clone();
      this.commit(this.currentState);
      return this.currentState;
    }

    if (target && typeof target === 'object') {
      this.currentState = WorldState.deserialize(target);
      this.commit(this.currentState);
      return this.currentState;
    }

    throw new Error('Invalid target for restoreState: expected tick number or WorldState snapshot');
  }

  /**
   * Rollback current state to a historical snapshot and prune subsequent ticks
   * @param {number} tick
   * @returns {WorldState}
   */
  rollback(tick) {
    const historicalSnapshot = this.getSnapshot(tick);
    if (!historicalSnapshot) {
      throw new Error(`Cannot rollback to tick ${tick}: snapshot not found in history`);
    }

    // Remove any snapshots that were recorded after this tick
    for (const storedTick of Array.from(this.history.keys())) {
      if (storedTick > tick) {
        this.history.delete(storedTick);
      }
    }

    this.currentState = historicalSnapshot.clone();
    return this.currentState;
  }

  /**
   * Clear all historical snapshots except the current state
   */
  clearHistory() {
    this.history.clear();
    this.commit(this.currentState);
  }
}

export default StateManager;
