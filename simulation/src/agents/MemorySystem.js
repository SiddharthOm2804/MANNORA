/**
 * MemorySystem manages the cognitive experience, short-term working memory,
 * and episodic long-term memory of individual citizens.
 *
 * Implements deterministic importance calculation, memory decay/consolidation,
 * and associative recall without LLM overhead.
 */
export class MemorySystem {
  /**
   * @param {Object} [config]
   * @param {Array<Object>} [config.workingMemory=[]]
   * @param {Array<Object>} [config.episodicMemory=[]]
   * @param {number} [config.maxWorking=20] - Max short-term memory buffer capacity
   * @param {number} [config.maxEpisodic=50] - Max long-term episodic memory capacity
   */
  constructor(config = {}) {
    this.workingMemory = Array.isArray(config.workingMemory) ? structuredClone(config.workingMemory) : [];
    this.episodicMemory = Array.isArray(config.episodicMemory) ? structuredClone(config.episodicMemory) : [];
    this.maxWorking = config.maxWorking || 20;
    this.maxEpisodic = config.maxEpisodic || 50;
    this._nextId = 1;
  }

  /**
   * Record a new experience or perception into memory.
   *
   * Automatically computes deterministic importance and routes significant memories
   * to long-term episodic consolidation.
   *
   * @param {Object} entry
   * @param {number} [entry.tick=0]
   * @param {string} [entry.type='action'] - 'action' | 'observation' | 'interaction' | 'milestone' | 'economic' | 'trauma'
   * @param {string} entry.description
   * @param {number} [entry.importance] - Optional explicit importance [0, 1]
   * @param {number} [entry.emotionalValence=0.0] - Emotion score [-1.0, 1.0]
   * @param {string} [entry.relatedAgentId=null]
   * @param {Object} [entry.location=null]
   * @param {Object} [entry.metadata={}]
   * @returns {Object} Stored memory record
   */
  record(entry) {
    if (!entry || !entry.description) {
      throw new Error('Memory entry must include a description');
    }

    const type = entry.type || 'action';
    const emotionalValence = Math.max(-1.0, Math.min(1.0, entry.emotionalValence ?? 0.0));
    
    // Deterministic importance calculation if not explicitly provided
    let importance = entry.importance;
    if (typeof importance !== 'number') {
      importance = this._calculateImportance(type, emotionalValence, entry.metadata || {});
    }
    importance = Math.max(0.0, Math.min(1.0, Number(importance.toFixed(2))));

    const tick = entry.tick ?? 0;
    const record = {
      id: `mem_t${tick}_${this._nextId++}`,
      tick,
      timestamp: entry.timestamp || `TICK#${tick}`,
      type,
      description: entry.description,
      importance,
      emotionalValence,
      relatedAgentId: entry.relatedAgentId || null,
      location: entry.location ? { ...entry.location } : null,
      metadata: structuredClone(entry.metadata || {}),
    };

    // 1. Add to Short-Term Working Memory
    this.workingMemory.unshift(record);
    if (this.workingMemory.length > this.maxWorking) {
      this.workingMemory.pop();
    }

    // 2. Consolidate to Long-Term Episodic Memory if importance exceeds threshold (>= 0.6)
    if (importance >= 0.6 || type === 'milestone' || type === 'trauma') {
      this.episodicMemory.unshift(record);
      if (this.episodicMemory.length > this.maxEpisodic) {
        // Evict least important old episodic memory
        this._evictLeastImportantEpisodic();
      }
    }

    return record;
  }

  /**
   * Deterministically calculate importance score based on event type, emotion, and context.
   * @private
   */
  _calculateImportance(type, emotionalValence, metadata) {
    let base = 0.3;

    switch (type) {
      case 'trauma':
        base = 0.95;
        break;
      case 'milestone':
        base = 0.90;
        break;
      case 'interaction':
        base = 0.50 + Math.abs(emotionalValence) * 0.3;
        break;
      case 'economic':
        const value = metadata.amount || 0;
        base = value > 200 ? 0.70 : (value > 50 ? 0.50 : 0.35);
        break;
      case 'action':
        base = 0.40;
        break;
      case 'observation':
      default:
        base = 0.25;
        break;
    }

    // High emotion magnifies importance
    const emotionMultiplier = 1 + Math.abs(emotionalValence) * 0.25;
    return Math.min(1.0, base * emotionMultiplier);
  }

  /**
   * Evicts the lowest importance memory from episodic buffer.
   * @private
   */
  _evictLeastImportantEpisodic() {
    let lowestIdx = this.episodicMemory.length - 1;
    let lowestImportance = 2.0;

    for (let i = this.episodicMemory.length - 1; i >= 0; i--) {
      if (this.episodicMemory[i].importance < lowestImportance) {
        lowestImportance = this.episodicMemory[i].importance;
        lowestIdx = i;
      }
    }

    this.episodicMemory.splice(lowestIdx, 1);
  }

  /**
   * Get the most recent working memories.
   * @param {number} [count=5]
   * @returns {Array<Object>}
   */
  getRecentMemories(count = 5) {
    return this.workingMemory.slice(0, count);
  }

  /**
   * Get significant episodic memories.
   * @param {number} [count=5]
   * @param {number} [minImportance=0.5]
   * @returns {Array<Object>}
   */
  getEpisodicMemories(count = 5, minImportance = 0.5) {
    return this.episodicMemory
      .filter((m) => m.importance >= minImportance)
      .slice(0, count);
  }

  /**
   * Retrieve all memories involving a specific other agent.
   * @param {string} agentId
   * @param {number} [limit=10]
   * @returns {Array<Object>}
   */
  getMemoriesWithAgent(agentId, limit = 10) {
    if (!agentId) return [];
    const combined = [...this.workingMemory, ...this.episodicMemory];
    const seen = new Set();
    const result = [];

    for (const mem of combined) {
      if (mem.relatedAgentId === agentId && !seen.has(mem.id)) {
        seen.add(mem.id);
        result.push(mem);
        if (result.length >= limit) break;
      }
    }
    return result;
  }

  /**
   * Retrieve memories matching a specific type.
   * @param {string} type
   * @param {number} [limit=10]
   * @returns {Array<Object>}
   */
  getMemoriesByType(type, limit = 10) {
    const combined = [...this.workingMemory, ...this.episodicMemory];
    const seen = new Set();
    const result = [];

    for (const mem of combined) {
      if (mem.type === type && !seen.has(mem.id)) {
        seen.add(mem.id);
        result.push(mem);
        if (result.length >= limit) break;
      }
    }
    return result;
  }

  /**
   * Total number of stored memory records across working and episodic tiers.
   * @returns {number}
   */
  get totalCount() {
    return this.workingMemory.length + this.episodicMemory.length;
  }

  /**
   * Serialize MemorySystem into plain object.
   * @returns {Object}
   */
  serialize() {
    return {
      workingMemory: structuredClone(this.workingMemory),
      episodicMemory: structuredClone(this.episodicMemory),
      maxWorking: this.maxWorking,
      maxEpisodic: this.maxEpisodic,
    };
  }

  /**
   * Restore MemorySystem from plain object.
   * @param {Object} data
   * @returns {MemorySystem}
   */
  static deserialize(data = {}) {
    return new MemorySystem(data);
  }
}

export default MemorySystem;
