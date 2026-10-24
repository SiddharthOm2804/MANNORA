import { MemoryStore } from './MemoryStore.js';
import { DeterministicRuleFallbackProvider } from '../interfaces/DeterministicRuleFallbackProvider.js';

/**
 * MemoryManager coordinates structured citizen and civilization memories.
 *
 * Filters for HIGH-IMPACT events:
 * - major financial loss (loss > 50% or severe debt)
 * - job change (hire, layoff, founding business)
 * - important relationship (family formation, new confidant, rival)
 * - major disaster (famine, blackout, solar storm)
 * - government policy impact (tax hike, rationing, welfare receipt)
 * - successful business event (record profit, expansion)
 *
 * Discards repetitive, mundane simulation steps to keep memory clean and performant.
 */
export class MemoryManager {
  static EVENT_TYPES = {
    FINANCIAL_LOSS: 'major_financial_loss',
    JOB_CHANGE: 'job_change',
    IMPORTANT_RELATIONSHIP: 'important_relationship',
    MAJOR_DISASTER: 'major_disaster',
    GOVERNMENT_POLICY: 'government_policy_impact',
    BUSINESS_EVENT: 'successful_business_event',
    GENERIC: 'general_memory',
  };

  /**
   * Minimum importance threshold required to commit an event to permanent episodic memory
   */
  static SIGNIFICANCE_THRESHOLD = 0.60;

  /**
   * @param {Object} [options]
   * @param {number} [options.maxLongTermRecords=300]
   */
  constructor(options = {}) {
    this.memoryStore = new MemoryStore(options);
    this.maxLongTermRecords = options.maxLongTermRecords || 300;
    this.embeddingProvider = options.embeddingProvider || new DeterministicRuleFallbackProvider();
  }

  /**
   * Filters and commits a memory if and only if it represents a meaningful milestone.
   *
   * @param {Object} memoryItem
   * @param {string} memoryItem.type - One of MemoryManager.EVENT_TYPES
   * @param {string} memoryItem.description
   * @param {number} [memoryItem.importance=0.5] - Scale [0.0, 1.0]
   * @param {number} [memoryItem.emotionalValence=0.0] - Scale [-1.0, 1.0]
   * @param {number} [memoryItem.tick=0]
   * @param {Object} [memoryItem.metadata={}]
   * @returns {Promise<Object|null>} The committed memory record, or null if below threshold
   */
  async recordMilestone(memoryItem) {
    const importance = Number(memoryItem.importance ?? 0.5);

    // Filter out low-importance mundane noise
    if (importance < MemoryManager.SIGNIFICANCE_THRESHOLD) {
      // Store in transient working memory only
      this.memoryStore.addWorkingMemory({
        ...memoryItem,
        type: memoryItem.type || MemoryManager.EVENT_TYPES.GENERIC,
      });
      return null;
    }

    // High significance: compute vector embedding and commit to episodic memory
    const embedding = await this.embeddingProvider.embed(memoryItem.description);

    const record = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      tick: memoryItem.tick ?? 0,
      type: memoryItem.type,
      description: memoryItem.description,
      importance,
      emotionalValence: memoryItem.emotionalValence ?? 0.0,
      embedding,
      metadata: memoryItem.metadata || {},
      recordedAt: new Date().toISOString(),
    };

    this.memoryStore.addEpisodicMemory(record);
    return record;
  }

  /**
   * Get all episodic memories
   * @returns {Object[]}
   */
  getEpisodicMemories() {
    return this.memoryStore.episodicMemory;
  }

  /**
   * Get recent working memories
   * @returns {Object[]}
   */
  getWorkingMemories() {
    return this.memoryStore.workingMemory;
  }
}

export default MemoryManager;
