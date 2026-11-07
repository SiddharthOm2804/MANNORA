import { EventEmitter } from 'events';
import { SnapshotSystem } from './SnapshotSystem.js';
import { BranchEngine } from './BranchEngine.js';
import { CounterfactualEngine } from './CounterfactualEngine.js';

/**
 * TimeMachine is the temporal coordinator for NEURAL CITY.
 *
 * Implements:
 * - pause / resume / rewind
 * - jump to day / jump to tick
 * - automated and manual snapshots
 * - restore from snapshot
 * - branching without overwriting baseline
 * - counterfactual comparative simulation
 */
export class TimeMachine extends EventEmitter {
  /**
   * @param {import('../core/SimulationEngine.js').SimulationEngine} engine
   * @param {Object} [options]
   */
  constructor(engine, options = {}) {
    super();

    this.engine = engine;
    this.snapshotSystem = new SnapshotSystem(options.snapshot);
    this.branchEngine = new BranchEngine(options.branch);
    this.counterfactualEngine = new CounterfactualEngine(options.counterfactual);

    // Initial snapshot of initial state if engine exists
    if (this.engine && this.engine.stateManager) {
      this.captureSnapshot('Genesis State // Tick 0', { tag: 'GENESIS' });
    }
  }

  // ==================== PLAYBACK CONTROLS ====================

  /**
   * Pause simulation ticking
   */
  pause() {
    if (this.engine) {
      this.engine.pause();
      this.emit('time:pause', this.getStatus());
    }
  }

  /**
   * Resume simulation ticking
   */
  resume() {
    if (this.engine) {
      this.engine.resume();
      this.emit('time:resume', this.getStatus());
    }
  }

  /**
   * Rewind simulation by N ticks or to a specific tick
   * @param {number} targetTickOrDelta - If negative, rewinds by delta; if positive, jumps back to tick
   */
  rewind(targetTickOrDelta = 1) {
    if (!this.engine) return null;

    const currentTick = this.engine.clock.currentTick;
    let targetTick;

    if (targetTickOrDelta <= 0) {
      targetTick = Math.max(0, currentTick + targetTickOrDelta);
    } else if (targetTickOrDelta < currentTick) {
      targetTick = targetTickOrDelta;
    } else {
      targetTick = Math.max(0, currentTick - 1);
    }

    const state = this.engine.rollback(targetTick);
    this.emit('time:rewind', { targetTick, state: state.serialize() });
    return state;
  }

  /**
   * Jump directly to a simulation day (e.g. Day 5)
   * If day is in the past: restores from closest snapshot or rewinds.
   * If day is in the future: fast-forwards deterministically.
   *
   * @param {number} targetDay - 1-indexed simulation day
   * @returns {import('../core/WorldState.js').WorldState}
   */
  jumpToDay(targetDay) {
    if (!this.engine) return null;
    const ticksPerHour = this.engine.clock.ticksPerHour || 1;
    const hoursPerDay = this.engine.clock.hoursPerDay || 24;
    const ticksPerDay = ticksPerHour * hoursPerDay;

    const targetTick = Math.max(0, (targetDay - 1) * ticksPerDay);
    return this.jumpToTick(targetTick);
  }

  /**
   * Jump directly to a simulation tick
   * @param {number} targetTick
   */
  jumpToTick(targetTick) {
    if (!this.engine) return null;

    const currentTick = this.engine.clock.currentTick;

    if (targetTick < currentTick) {
      // Past: check if we have a direct snapshot in SnapshotSystem
      const snapshots = this.snapshotSystem.getSnapshotsAtTick(targetTick);
      if (snapshots.length > 0) {
        const restoredState = this.snapshotSystem.restore(snapshots[0].id);
        this.engine.stateManager.restoreState(restoredState);
        this.engine.clock.currentTick = targetTick;
        this.emit('time:jump', { targetTick, restored: true });
        return restoredState;
      }
      // Otherwise rollback state manager history
      const rolled = this.engine.rollback(targetTick);
      this.emit('time:jump', { targetTick, restored: false });
      return rolled;
    }

    if (targetTick > currentTick) {
      // Future: step deterministically up to targetTick
      const wasRunning = this.engine.clock.isRunning;
      this.engine.pause();

      while (this.engine.clock.currentTick < targetTick) {
        this.engine.step();
      }

      if (wasRunning) {
        this.engine.resume();
      }

      this.emit('time:jump', { targetTick, fastForwarded: true });
      return this.engine.stateManager.getCurrentState();
    }

    return this.engine.stateManager.getCurrentState();
  }

  // ==================== SNAPSHOT SYSTEM ====================

  /**
   * Capture a historical checkpoint snapshot with custom label and metadata
   *
   * @param {string} [label]
   * @param {Object} [metadata={}]
   * @returns {Object} Snapshot record
   */
  captureSnapshot(label, metadata = {}) {
    if (!this.engine) return null;
    const currentState = this.engine.stateManager.getCurrentState();

    const snapshot = this.snapshotSystem.capture(currentState, {
      label,
      branchId: this.branchEngine.activeBranchId,
      ...metadata,
    });

    this.emit('snapshot:captured', snapshot);
    return snapshot;
  }

  /**
   * Restore simulation engine state from a snapshot ID
   *
   * @param {string} snapshotId
   * @returns {import('../core/WorldState.js').WorldState}
   */
  restoreSnapshot(snapshotId) {
    if (!this.engine) return null;

    const restoredState = this.snapshotSystem.restore(snapshotId);
    this.engine.stateManager.restoreState(restoredState);
    this.engine.clock.currentTick = restoredState.tick;

    this.emit('snapshot:restored', { snapshotId, tick: restoredState.tick });
    return restoredState;
  }

  /**
   * List all captured snapshots
   * @param {string} [branchId]
   */
  listSnapshots(branchId) {
    return this.snapshotSystem.listSnapshots(branchId);
  }

  // ==================== BRANCHING & COUNTERFACTUALS ====================

  /**
   * Fork a new branch from a historical snapshot or the current engine state.
   *
   * @param {Object} options
   * @param {string} options.name
   * @param {string} [options.description]
   * @param {string} [options.snapshotId] - If provided, forks from that snapshot; otherwise forks from current head
   * @param {Object} [options.variableMutations={}] - Initial intervention (e.g. water = 130)
   * @param {Array<string>} [options.policiesToEnact=[]]
   * @returns {Object} Branch record
   */
  createBranch(options = {}) {
    let baseState;

    if (options.snapshotId) {
      baseState = this.snapshotSystem.restore(options.snapshotId);
    } else if (this.engine) {
      baseState = this.engine.stateManager.getCurrentState().clone();
    } else {
      throw new Error('TimeMachine.createBranch: No baseState available to branch from');
    }

    const branch = this.branchEngine.createBranch({
      ...options,
      baseState,
    });

    this.emit('branch:created', branch);
    return branch;
  }

  /**
   * Run a comparative experiment between original baseline and a branch.
   *
   * @param {Object} params
   * @param {string} params.branchId - The branch to test
   * @param {number} [params.ticks=20] - Duration of comparison
   * @param {number} [params.seed=42]
   * @returns {Object} Comparison report
   */
  runCounterfactualExperiment(params = {}) {
    const branch = this.branchEngine.getBranch(params.branchId);
    if (!branch) {
      throw new Error(`Branch '${params.branchId}' not found`);
    }

    // Determine baseline state from forkTick snapshot or initial snapshot
    const baselineState = this.engine.stateManager.getSnapshot(branch.forkTick)
      || this.engine.stateManager.getCurrentState();

    const report = this.counterfactualEngine.runComparison({
      baselineState,
      branchState: branch.currentState,
      ticks: params.ticks || 20,
      seed: params.seed || this.engine.random?.getSeed() || 42,
    });

    this.emit('counterfactual:completed', { branchId: params.branchId, report });
    return report;
  }

  /**
   * Get Time Machine telemetry status
   */
  getStatus() {
    return {
      clock: this.engine?.clock?.getStatus() || null,
      activeBranchId: this.branchEngine.activeBranchId,
      branchesCount: this.branchEngine.branches.size,
      snapshotsCount: this.snapshotSystem.snapshots.size,
      currentTick: this.engine?.clock?.currentTick || 0,
      currentDay: this.engine?.clock?.simulationDay || 1,
      currentHour: this.engine?.clock?.simulationHour || 0,
    };
  }
}

export default TimeMachine;
