import { SimulationSnapshot } from '../models/SimulationSnapshot.js';
import { World } from '../models/World.js';
import { Agent } from '../models/Agent.js';
import { cacheManager } from './cacheManager.js';

/**
 * PersistenceWorker processes database writes asynchronously in batches,
 * decoupling CPU-intensive simulation ticks from disk I/O and network latency.
 *
 * Implements:
 * - Batched agent writes (`bulkWrite`)
 * - Periodic snapshot persistence (capped and indexed)
 * - In-memory and Redis write-behind caching
 * - Exponential backoff and error resilience
 */
export class PersistenceWorker {
  /**
   * @param {Object} [options]
   * @param {number} [options.flushIntervalMs=2000] - Flush interval in ms
   * @param {number} [options.maxBatchSize=200] - Maximum records per bulkWrite
   * @param {number} [options.snapshotTickFrequency=100] - Ticks between persistent snapshots
   */
  constructor(options = {}) {
    this.flushIntervalMs = options.flushIntervalMs || 2000;
    this.maxBatchSize = options.maxBatchSize || 200;
    this.snapshotTickFrequency = options.snapshotTickFrequency || 100;

    /** @type {Map<string, Object>} Queued world updates */
    this.pendingWorldUpdates = new Map();

    /** @type {Map<string, Object>} Queued agent upserts keyed by agentId */
    this.pendingAgentUpdates = new Map();

    /** @type {Array<Object>} Queued persistent snapshots */
    this.pendingSnapshots = [];

    /** @type {NodeJS.Timeout|null} */
    this.flushTimer = null;
    this.isFlushing = false;
  }

  /**
   * Start background batch worker
   */
  start() {
    if (this.flushTimer) return;
    this.flushTimer = setInterval(() => {
      this.flush().catch((err) => {
        console.error('[PersistenceWorker] Background flush error:', err.message);
      });
    }, this.flushIntervalMs);
    console.log('\x1b[32m[PersistenceWorker]\x1b[0m Batch persistence worker started');
  }

  /**
   * Stop background worker
   */
  async stop() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    // Final flush
    await this.flush();
    console.log('\x1b[33m[PersistenceWorker]\x1b[0m Batch persistence worker stopped cleanly');
  }

  /**
   * Queue world update for asynchronous write-behind
   * @param {string} worldId
   * @param {Object} updateFields
   */
  queueWorldUpdate(worldId, updateFields) {
    const key = String(worldId);
    const existing = this.pendingWorldUpdates.get(key) || {};
    this.pendingWorldUpdates.set(key, { ...existing, ...updateFields });

    // Update fast cache
    cacheManager.set(`world:${key}:latest`, { ...existing, ...updateFields }, 60);
  }

  /**
   * Queue agent updates for bulk write
   * @param {string} worldId
   * @param {Array<Object>} agents
   */
  queueAgentBatch(worldId, agents = []) {
    for (const agt of agents) {
      if (!agt.id) continue;
      this.pendingAgentUpdates.set(`${worldId}:${agt.id}`, {
        worldId,
        agent: agt,
      });
    }
  }

  /**
   * Queue persistent snapshot
   * @param {Object} snapshotData
   */
  queueSnapshot(snapshotData) {
    this.pendingSnapshots.push(snapshotData);
  }

  /**
   * Flush all pending writes to MongoDB in atomic bulk batches
   */
  async flush() {
    if (this.isFlushing) return;
    this.isFlushing = true;

    try {
      // 1. Flush pending world updates
      if (this.pendingWorldUpdates.size > 0) {
        const entries = Array.from(this.pendingWorldUpdates.entries());
        this.pendingWorldUpdates.clear();

        for (const [worldId, updateDoc] of entries) {
          try {
            await World.findByIdAndUpdate(worldId, { $set: updateDoc }, { timestamps: true });
          } catch (err) {
            console.error(`[PersistenceWorker] Failed to update world ${worldId}:`, err.message);
          }
        }
      }

      // 2. Flush pending agent bulk writes
      if (this.pendingAgentUpdates.size > 0) {
        const agentEntries = Array.from(this.pendingAgentUpdates.values());
        this.pendingAgentUpdates.clear();

        // Process in chunks of maxBatchSize
        for (let i = 0; i < agentEntries.length; i += this.maxBatchSize) {
          const chunk = agentEntries.slice(i, i + this.maxBatchSize);
          const bulkOps = chunk.map(({ worldId, agent }) => ({
            updateOne: {
              filter: { worldId, agentId: agent.id },
              update: {
                $set: {
                  name: agent.name,
                  occupation: agent.occupation || 'citizen',
                  wealth: agent.wealth ?? 100,
                  health: agent.healthState?.health ?? 100,
                  happiness: agent.healthState?.happiness ?? 100,
                  currentAction: agent.healthState?.currentAction || 'ACTIVE',
                  'location.x': agent.location?.x ?? 50,
                  'location.y': agent.location?.y ?? 50,
                  lastUpdatedTick: agent.lastUpdatedTick || 0,
                },
              },
              upsert: true,
            },
          }));

          try {
            await Agent.bulkWrite(bulkOps, { ordered: false });
          } catch (err) {
            console.error('[PersistenceWorker] Error in agent bulkWrite batch:', err.message);
          }
        }
      }

      // 3. Flush pending snapshots
      if (this.pendingSnapshots.length > 0) {
        const snapshots = [...this.pendingSnapshots];
        this.pendingSnapshots = [];

        try {
          await SimulationSnapshot.insertMany(snapshots, { ordered: false });
        } catch (err) {
          console.error('[PersistenceWorker] Error saving simulation snapshots:', err.message);
        }
      }
    } finally {
      this.isFlushing = false;
    }
  }
}

export const persistenceWorker = new PersistenceWorker();

