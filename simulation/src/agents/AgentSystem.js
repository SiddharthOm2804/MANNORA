import { AgentEngine } from './AgentEngine.js';

/**
 * AgentSystem is the pipeline subsystem adapter for the NEURAL CITY SimulationEngine (Priority 20).
 *
 * Coordinates autonomous individual agent logic:
 * needs progression, diurnal cycles, spatial navigation, resource consumption,
 * productivity contributions, and health/happiness state updates.
 *
 * Backed by the Phase 5 AgentEngine multi-agent citizen architecture.
 */
export class AgentSystem {
  /**
   * @param {Object} [config]
   */
  constructor(config = {}) {
    this.agentEngine = new AgentEngine(config);
  }

  /**
   * Pipeline step: updates all active agents in the simulation world.
   *
   * @param {import('../core/WorldState.js').WorldState} worldState
   * @param {number} delta
   * @param {import('../core/RandomEngine.js').RandomEngine} random
   * @param {Object} [clockInfo={}]
   */
  update(worldState, delta, random, clockInfo = {}) {
    this.agentEngine.update(worldState, delta, random, clockInfo);
  }

  /**
   * Factory helper to instantiate a new agent with deterministic attributes.
   * Maintains 100% backward compatibility with Phase 4 tests while returning
   * complete Phase 5 citizen schemas.
   *
   * @param {string} id
   * @param {Object} [overrides={}]
   * @param {import('../core/RandomEngine.js').RandomEngine} [random=null]
   * @returns {Object}
   */
  static createAgent(id, overrides = {}, random = null) {
    const citizen = AgentEngine.createCitizen(id, overrides, random);
    return citizen.toPlainObject();
  }
}

export default AgentSystem;
