/**
 * DeltaCompressor computes compact state deltas between simulation ticks.
 *
 * Prevents network saturation by emitting ONLY changed fields, numeric deltas,
 * and sparse entity/agent updates instead of serializing the full world state
 * (thousands of entities) every single tick.
 */
export class DeltaCompressor {
  /**
   * @param {Object} [options]
   * @param {number} [options.agentBatchLimit=100] - Max agents to include per delta frame
   * @param {number} [options.floatPrecision=2] - Rounding decimal places for floats
   */
  constructor(options = {}) {
    this.agentBatchLimit = options.agentBatchLimit || 100;
    this.floatPrecision = options.floatPrecision ?? 2;
    /** @type {Map<string, Object>} Last known full or shallow states by worldId */
    this.previousStates = new Map();
  }

  /**
   * Round floating point numbers to save bandwidth
   * @param {number} val
   * @returns {number}
   */
  round(val) {
    if (typeof val !== 'number' || isNaN(val)) return 0;
    const factor = 10 ** this.floatPrecision;
    return Math.round(val * factor) / factor;
  }

  /**
   * Reset baseline cache for a world
   * @param {string} worldId
   */
  resetWorld(worldId) {
    this.previousStates.delete(String(worldId));
  }

  /**
   * Create a keyframe (full baseline) payload
   * @param {string} worldId
   * @param {Object} currentState
   * @returns {Object}
   */
  createKeyframe(worldId, currentState) {
    const key = String(worldId);
    this.previousStates.set(key, {
      tick: currentState.tick,
      population: { ...(currentState.population || {}) },
      resources: { ...(currentState.resources || {}) },
      economy: { ...(currentState.economy || {}) },
      metrics: { ...(currentState.metrics || {}) },
    });

    return {
      type: 'KEYFRAME',
      tick: currentState.tick,
      isKeyframe: true,
      state: currentState,
    };
  }

  /**
   * Compute a sparse delta between currentState and the previous state.
   * Emits only modified metrics, resource changes, economy changes, and changed agents.
   *
   * @param {string} worldId
   * @param {Object} currentState
   * @param {Object} [meta]
   * @returns {Object} Delta package
   */
  computeDelta(worldId, currentState, meta = {}) {
    const key = String(worldId);
    const prev = this.previousStates.get(key);

    if (!prev) {
      return this.createKeyframe(worldId, currentState);
    }

    const delta = {
      type: 'DELTA',
      tick: currentState.tick,
      isKeyframe: false,
      delta: meta.delta || 1,
      simulatedTime: meta.simulatedTime,
      changes: {},
    };

    let hasChanges = false;

    // 1. Resources delta
    if (currentState.resources) {
      const resDiff = {};
      for (const [k, v] of Object.entries(currentState.resources)) {
        const prevVal = prev.resources?.[k];
        if (prevVal === undefined || Math.abs(prevVal - v) > 0.01) {
          resDiff[k] = this.round(v);
        }
      }
      if (Object.keys(resDiff).length > 0) {
        delta.changes.resources = resDiff;
        hasChanges = true;
      }
    }

    // 2. Economy delta
    if (currentState.economy) {
      const econDiff = {};
      for (const [k, v] of Object.entries(currentState.economy)) {
        if (typeof v === 'object' && v !== null) {
          // Market prices or sub-objects
          econDiff[k] = v;
        } else {
          const prevVal = prev.economy?.[k];
          if (prevVal === undefined || Math.abs(prevVal - v) > 0.01) {
            econDiff[k] = typeof v === 'number' ? this.round(v) : v;
          }
        }
      }
      if (Object.keys(econDiff).length > 0) {
        delta.changes.economy = econDiff;
        hasChanges = true;
      }
    }

    // 3. Population delta
    if (currentState.population) {
      const popDiff = {};
      for (const [k, v] of Object.entries(currentState.population)) {
        if (typeof v !== 'object') {
          const prevVal = prev.population?.[k];
          if (prevVal === undefined || prevVal !== v) {
            popDiff[k] = v;
          }
        }
      }
      if (Object.keys(popDiff).length > 0) {
        delta.changes.population = popDiff;
        hasChanges = true;
      }
    }

    // 4. Metrics / KPIs delta
    if (currentState.metrics) {
      const metricDiff = {};
      for (const [k, v] of Object.entries(currentState.metrics)) {
        const prevVal = prev.metrics?.[k];
        if (prevVal === undefined || Math.abs(prevVal - v) > 0.01) {
          metricDiff[k] = typeof v === 'number' ? this.round(v) : v;
        }
      }
      if (Object.keys(metricDiff).length > 0) {
        delta.changes.metrics = metricDiff;
        hasChanges = true;
      }
    }

    // 5. Active agents delta / sampled agents (instead of thousands every frame)
    if (currentState.agents && Array.isArray(currentState.agents)) {
      // Send only agents that changed action, location, or active sample
      const changedAgents = [];
      const limit = Math.min(this.agentBatchLimit, currentState.agents.length);
      for (let i = 0; i < limit; i++) {
        const agt = currentState.agents[i];
        changedAgents.push({
          id: agt.id,
          x: agt.location?.x !== undefined ? this.round(agt.location.x) : undefined,
          y: agt.location?.y !== undefined ? this.round(agt.location.y) : undefined,
          action: agt.healthState?.currentAction || agt.currentAction,
          health: agt.healthState?.health !== undefined ? Math.round(agt.healthState.health) : undefined,
          happiness: agt.healthState?.happiness !== undefined ? Math.round(agt.healthState.happiness) : undefined,
          wealth: agt.wealth !== undefined ? this.round(agt.wealth) : undefined,
        });
      }
      if (changedAgents.length > 0) {
        delta.changes.agents = changedAgents;
        delta.totalAgents = currentState.agents.length;
        hasChanges = true;
      }
    }

    // Update previous baseline
    this.previousStates.set(key, {
      tick: currentState.tick,
      population: { ...(currentState.population || {}) },
      resources: { ...(currentState.resources || {}) },
      economy: { ...(currentState.economy || {}) },
      metrics: { ...(currentState.metrics || {}) },
    });

    delta.hasChanges = hasChanges;
    return delta;
  }
}

export const deltaCompressor = new DeltaCompressor();

