import { WorldState } from './WorldState.js';

/**
 * StateManager manages snapshots, rollbacks, state history,
 * and immutable transition checkpoints for the simulation.
 */
export class StateManager {
  /**
   * @param {Object} [options]
   * @param {number} [options.maxHistory=100] - Maximum snapshots retained in memory
   * @param {number} [options.snapshotInterval=1] - Frequency of state snapshots (ticks)
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

  /**
   * Get the current active WorldState
   * @returns {WorldState}
   */
  getCurrentState() {
    return this.currentState;
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

  /**
   * Rollback current state to a historical snapshot
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
   * List all stored snapshot tick numbers
   * @returns {number[]}
   */
  getHistoryTicks() {
    return Array.from(this.history.keys()).sort((a, b) => a - b);
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

  /**
   * Clear all historical snapshots except the current state
   */
  clearHistory() {
    this.history.clear();
    this.commit(this.currentState);
  }
}

export default StateManager;
