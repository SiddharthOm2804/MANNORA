import { DeterministicRuleFallbackProvider } from '../interfaces/DeterministicRuleFallbackProvider.js';

/**
 * RetrievalService enables semantic and context-weighted retrieval of memories.
 *
 * Scoring function:
 * Score = (RecencyWeight * RecencyScore) + (ImportanceWeight * Importance) + (RelevanceWeight * CosineSimilarity)
 */
export class RetrievalService {
  /**
   * @param {Object} [options]
   * @param {number} [options.recencyWeight=0.25]
   * @param {number} [options.importanceWeight=0.35]
   * @param {number} [options.relevanceWeight=0.40]
   */
  constructor(options = {}) {
    this.recencyWeight = options.recencyWeight ?? 0.25;
    this.importanceWeight = options.importanceWeight ?? 0.35;
    this.relevanceWeight = options.relevanceWeight ?? 0.40;
    this.embeddingProvider = options.embeddingProvider || new DeterministicRuleFallbackProvider();
  }

  /**
   * Compute cosine similarity between two float vectors.
   *
   * @param {number[]} vecA
   * @param {number[]} vecB
   * @returns {number} Value in [0.0, 1.0]
   */
  static cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    const sim = dot / (Math.sqrt(normA) * Math.sqrt(normB));
    return Math.max(0, Math.min(1, (sim + 1) / 2)); // Normalize to [0, 1]
  }

  /**
   * Query memories using semantic relevance, recency, and importance.
   *
   * @param {string} queryText - The prompt or question to contextualize
   * @param {Object[]} candidateMemories - Array of memory records
   * @param {Object} [options]
   * @param {number} [options.currentTick=100]
   * @param {number} [options.topK=5]
   * @returns {Promise<Array<{ memory: Object, score: number, similarity: number }>>}
   */
  async retrieve(queryText, candidateMemories = [], options = {}) {
    if (!candidateMemories || candidateMemories.length === 0) {
      return [];
    }

    const currentTick = options.currentTick ?? 100;
    const topK = options.topK ?? 5;

    // 1. Generate query embedding
    const queryEmbedding = await this.embeddingProvider.embed(queryText);

    // 2. Score each candidate memory
    const scored = candidateMemories.map((mem) => {
      // Semantic similarity
      const similarity = mem.embedding
        ? RetrievalService.cosineSimilarity(queryEmbedding, mem.embedding)
        : 0.5;

      // Recency: exponential decay based on tick distance
      const tickDelta = Math.max(0, currentTick - (mem.tick ?? 0));
      const recency = Math.exp(-tickDelta / 200);

      // Importance: normalized [0, 1]
      const importance = mem.importance ?? 0.5;

      const totalScore = Number(
        (
          this.relevanceWeight * similarity +
          this.importanceWeight * importance +
          this.recencyWeight * recency
        ).toFixed(4)
      );

      return {
        memory: mem,
        score: totalScore,
        similarity: Number(similarity.toFixed(3)),
        recency: Number(recency.toFixed(3)),
      };
    });

    // 3. Sort descending by score and pick top K
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }
}

export default RetrievalService;
