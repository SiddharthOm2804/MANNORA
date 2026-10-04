/**
 * MemoryStore manages structured memory buffers (working memory, episodic records, and sensory perceptions).
 * Ready for vector indexing and semantic retrieval in future phases.
 */
export class MemoryStore {
  /**
   * @param {Object} [options]
   * @param {number} [options.workingMemoryCapacity=20]
   * @param {number} [options.maxEpisodicRecords=500]
   */
  constructor(options = {}) {
    this.workingMemoryCapacity = options.workingMemoryCapacity || 20;
    this.maxEpisodicRecords = options.maxEpisodicRecords || 500;

    /** @type {Array<{ id: string, timestamp: string, content: any, importance: number }>} */
    this.workingMemory = [];

    /** @type {Array<{ id: string, tick: number, event: string, summary: string, emotion: string }>} */
    this.episodicMemory = [];
  }

  /**
   * Store a short-term memory observation
   */
  addWorkingMemory(item) {
    this.workingMemory.push({
      id: `wm_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...item,
    });

    if (this.workingMemory.length > this.workingMemoryCapacity) {
      this.workingMemory.shift();
    }
  }

  /**
   * Commit an episodic event to long-term memory
   */
  addEpisodicMemory(record) {
    this.episodicMemory.push({
      id: `ep_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      recordedAt: new Date().toISOString(),
      ...record,
    });

    if (this.episodicMemory.length > this.maxEpisodicRecords) {
      this.episodicMemory.shift();
    }
  }

  /**
   * Retrieve recent memory records
   */
  getRecentContext(count = 5) {
    return {
      working: this.workingMemory.slice(-count),
      episodic: this.episodicMemory.slice(-count),
    };
  }

  /**
   * Clear all memories
   */
  clear() {
    this.workingMemory = [];
    this.episodicMemory = [];
  }
}

export default MemoryStore;
