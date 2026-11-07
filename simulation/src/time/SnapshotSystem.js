import { WorldState } from '../core/WorldState.js';

/**
 * SnapshotSystem manages high-fidelity, indexed, metadata-enriched simulation snapshots.
 * Allows capturing, tagging, restoring, and querying historical points in time.
 */
export class SnapshotSystem {
  /**
   * @param {Object} [options]
   * @param {number} [options.maxSnapshots=150]
   */
  constructor(options = {}) {
    this.maxSnapshots = options.maxSnapshots || 150;
    /** @type {Map<string, Object>} Snapshots mapped by snapshot ID */
    this.snapshots = new Map();
    /** @type {Map<number, string[]>} Tick index mapped to snapshot IDs */
    this.tickIndex = new Map();
  }

  /**
   * Capture a snapshot from a WorldState instance.
   *
   * @param {WorldState} worldState - The state to snapshot
   * @param {Object} [metadata={}] - Custom tag, label, branchId, notes
   * @returns {Object} Snapshot record
   */
  capture(worldState, metadata = {}) {
    if (!worldState || !(worldState instanceof WorldState)) {
      throw new Error('SnapshotSystem.capture: Valid WorldState instance is required');
    }

    const tick = Number(worldState.tick ?? 0);
    const id = metadata.id || `snap_${metadata.branchId || 'main'}_t${tick}_${Date.now()}`;
    const timestamp = new Date().toISOString();

    const snapshot = {
      id,
      tick,
      branchId: metadata.branchId || 'main',
      label: metadata.label || `Tick ${tick} Snapshot`,
      description: metadata.description || `Captured at Day ${Math.floor(tick / 24) + 1}, Hour ${tick % 24}`,
      tag: metadata.tag || (tick === 0 ? 'GENESIS' : 'CHECKPOINT'),
      timestamp,
      stateData: worldState.serialize(),
      metrics: {
        population: worldState.population.total,
        treasury: worldState.economy.treasury,
        unemployment: worldState.population.unemploymentRate,
        satisfaction: worldState.metrics?.government?.civicApprovalScore ?? 75,
        water: worldState.resources.water?.current ?? 0,
        energy: worldState.resources.energy?.current ?? 0,
        minerals: worldState.resources.minerals?.current ?? 0,
        activeEvents: worldState.getActiveEvents().map((e) => e.title || e.type),
      },
      metadata: { ...metadata },
    };

    // Store in map
    this.snapshots.set(id, snapshot);

    // Update tick index
    if (!this.tickIndex.has(tick)) {
      this.tickIndex.set(tick, []);
    }
    this.tickIndex.get(tick).push(id);

    // Prune oldest if capacity exceeded
    if (this.snapshots.size > this.maxSnapshots) {
      const oldestId = Array.from(this.snapshots.keys())[0];
      this.deleteSnapshot(oldestId);
    }

    return snapshot;
  }

  /**
   * Restore a WorldState instance from a snapshot ID.
   *
   * @param {string} snapshotId
   * @returns {WorldState} Deserialized state
   */
  restore(snapshotId) {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) {
      throw new Error(`SnapshotSystem.restore: Snapshot '${snapshotId}' not found`);
    }

    return WorldState.deserialize(snapshot.stateData);
  }

  /**
   * Retrieve snapshot record by ID.
   * @param {string} snapshotId
   * @returns {Object|null}
   */
  getSnapshot(snapshotId) {
    return this.snapshots.get(snapshotId) || null;
  }

  /**
   * Get all snapshots for a specific tick.
   * @param {number} tick
   * @returns {Array<Object>}
   */
  getSnapshotsAtTick(tick) {
    const ids = this.tickIndex.get(tick) || [];
    return ids.map((id) => this.snapshots.get(id)).filter(Boolean);
  }

  /**
   * Get all snapshots belonging to a branch.
   * @param {string} [branchId]
   * @returns {Array<Object>}
   */
  listSnapshots(branchId = null) {
    const all = Array.from(this.snapshots.values());
    const filtered = branchId ? all.filter((s) => s.branchId === branchId) : all;
    return filtered.sort((a, b) => a.tick - b.tick);
  }

  /**
   * Delete snapshot by ID.
   * @param {string} snapshotId
   * @returns {boolean}
   */
  deleteSnapshot(snapshotId) {
    const snap = this.snapshots.get(snapshotId);
    if (!snap) return false;

    this.snapshots.delete(snapshotId);
    const list = this.tickIndex.get(snap.tick);
    if (list) {
      const idx = list.indexOf(snapshotId);
      if (idx !== -1) list.splice(idx, 1);
      if (list.length === 0) this.tickIndex.delete(snap.tick);
    }
    return true;
  }

  /**
   * Clear all snapshots.
   */
  clear() {
    this.snapshots.clear();
    this.tickIndex.clear();
  }
}

export default SnapshotSystem;
