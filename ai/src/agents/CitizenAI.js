import { BaseCognitiveAgent } from './BaseCognitiveAgent.js';
import { MemoryManager } from '../memory/MemoryManager.js';
import { RetrievalService } from '../memory/RetrievalService.js';
import { AIProviderFactory } from '../interfaces/AIProviderFactory.js';

/**
 * CitizenAI acts as an asynchronous cognitive assistant for citizens in NEURAL CITY.
 *
 * Responsibilities:
 * - Reasoning Assistant: Interprets milestone events and synthesizes personal narratives
 * - Planner: Proposes long-term goals and behavioral adjustments based on memories
 * - Memory Assistant: Summarizes life history, reflections, and emotional development
 *
 * CRITICAL ARCHITECTURAL CONSTRAINTS:
 * - AI does NOT replace the SimulationEngine or deterministic Agent decision loop.
 * - Selective AI invocation: ONLY invoked upon explicit user inspection or major milestone events.
 * - Resilient fallback: seamlessly functions without an external LLM.
 */
export class CitizenAI extends BaseCognitiveAgent {
  /**
   * @param {Object} config
   * @param {string} config.id - Citizen ID
   * @param {string} [config.name]
   * @param {string} [config.role='citizen']
   * @param {Object} [config.traits]
   * @param {Object} [config.aiProvider]
   */
  constructor(config = {}) {
    super(config);

    this.aiProvider = config.aiProvider || new AIProviderFactory().getProvider();
    this.memoryManager = new MemoryManager({ embeddingProvider: this.aiProvider });
    this.retrievalService = new RetrievalService({ embeddingProvider: this.aiProvider });
  }

  /**
   * Record a significant milestone into the citizen's cognitive memory
   * @param {Object} milestone
   */
  async recordMilestone(milestone) {
    return this.memoryManager.recordMilestone(milestone);
  }

  /**
   * Reasoning Assistant: Reflect on current life state and recent experiences.
   *
   * @param {Object} citizenState - Current snapshot from SimulationEngine
   * @param {Object} [worldContext={}]
   * @returns {Promise<Object>} Reflection, emotional state, and personal insights
   */
  async reflectOnLife(citizenState, worldContext = {}) {
    // 1. Retrieve top salient memories
    const episodic = this.memoryManager.getEpisodicMemories();
    const relevantMemories = await this.retrievalService.retrieve(
      'What are my most impactful life experiences, struggles, and relationships?',
      episodic,
      { currentTick: worldContext.tick || 100, topK: 4 }
    );

    const memorySummaries = relevantMemories.map(
      (m) => `[Tick ${m.memory.tick}] (${m.memory.type}) ${m.memory.description}`
    );

    // 2. Synthesize prompt
    const prompt = [
      {
        role: 'system',
        content: `You are the cognitive reasoning assistant for ${this.name}, a citizen with role "${citizenState.occupation || this.role}" in NEURAL CITY.
Analyze their situation and provide an introspective reflection in JSON format.
Traits: Rationality: ${citizenState.personalityTraits?.rationality ?? 0.6}, Ambition: ${citizenState.personalityTraits?.ambition ?? 0.5}.
Vitals: Health ${citizenState.healthState?.health ?? 100}%, Wealth ${citizenState.wealth ?? 100} NC.`,
      },
      {
        role: 'user',
        content: `Reflect upon current living conditions and these milestone memories:
${memorySummaries.length > 0 ? memorySummaries.join('\n') : 'No major trauma or milestones recorded yet.'}
Return valid JSON with keys: reflection, mood, priorityGoal, suggestedAction.`,
      },
    ];

    // 3. Complete via AI provider (with automatic fallback)
    const result = await this.aiProvider.complete(prompt);

    try {
      const parsed = JSON.parse(result.text);
      return {
        citizenId: this.id,
        name: this.name,
        ...parsed,
        source: result.fallback ? 'deterministic_rule_engine' : 'llm_cognitive_assistant',
        retrievedMemoriesCount: relevantMemories.length,
      };
    } catch {
      return {
        citizenId: this.id,
        name: this.name,
        reflection: result.text,
        mood: 'contemplative',
        source: 'llm_cognitive_assistant',
        retrievedMemoriesCount: relevantMemories.length,
      };
    }
  }

  /**
   * Planner: Generate a strategic career or social plan for the citizen.
   *
   * @param {Object} citizenState
   * @param {Object} economicContext
   * @returns {Promise<Object>}
   */
  async generatePersonalPlan(citizenState, economicContext = {}) {
    const prompt = `As personal planning advisor for citizen ${this.name} (${citizenState.occupation}), wealth: ${citizenState.wealth} NC, suggest a 3-step personal advancement plan given current market conditions. Output JSON with { planTitle, steps, estimatedTimeframe }.`;

    const result = await this.aiProvider.complete(prompt);

    try {
      const parsed = JSON.parse(result.text);
      return {
        citizenId: this.id,
        ...parsed,
        source: result.fallback ? 'deterministic_rule_engine' : 'llm_cognitive_assistant',
      };
    } catch {
      return {
        citizenId: this.id,
        planTitle: 'Economic Self-Sufficiency & Skill Development',
        steps: [
          'Maintain regular shifts at workplace to ensure steady income.',
          'Form alliances with neighborhood guild members.',
          'Conserve emergency credits to safeguard against supply price spikes.',
        ],
        estimatedTimeframe: '100 simulation ticks',
        source: 'deterministic_rule_engine',
      };
    }
  }
}

export default CitizenAI;
