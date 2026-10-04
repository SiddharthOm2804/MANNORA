import { MemoryStore } from '../memory/MemoryStore.js';

/**
 * BaseCognitiveAgent provides the abstract cognitive architecture for multi-agent simulation.
 * Subclasses implement domain-specific decision making (Citizen, Government, Analyst).
 */
export class BaseCognitiveAgent {
  /**
   * @param {Object} config
   * @param {string} config.id - Unique agent ID
   * @param {string} config.name - Display name
   * @param {string} config.role - Role in civilization
   * @param {Object} [config.traits] - Personality or behavioral traits
   */
  constructor(config = {}) {
    if (!config.id) throw new Error('Agent id is required');

    this.id = config.id;
    this.name = config.name || `Agent-${config.id.slice(0, 6)}`;
    this.role = config.role || 'citizen';
    this.traits = config.traits || {};
    this.memory = new MemoryStore();
    this.state = {
      health: 100,
      happiness: 100,
      energy: 100,
      wealth: 50,
      currentAction: 'idle',
      target: null,
    };
  }

  /**
   * Perception step: process environment stimuli and write to working memory
   * @param {Object} environmentSnapshot
   */
  perceive(environmentSnapshot) {
    this.memory.addWorkingMemory({
      type: 'perception',
      data: environmentSnapshot,
      importance: 0.5,
    });
  }

  /**
   * Decision cycle: determine next goal or action based on perceptions and traits
   * @returns {Object} action plan
   */
  async decide() {
    // Phase 1 stub: Return default baseline action
    return {
      type: 'IDLE',
      agentId: this.id,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Execute chosen action and mutate internal state
   * @param {Object} action
   */
  act(action) {
    this.state.currentAction = action.type;
  }
}

export default BaseCognitiveAgent;
