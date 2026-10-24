import { AIProviderFactory } from '../interfaces/AIProviderFactory.js';
import { MemoryManager } from '../memory/MemoryManager.js';
import { RetrievalService } from '../memory/RetrievalService.js';

/**
 * GovernmentAI acts as a technocratic policy planner and civic assistant for NEURAL CITY.
 *
 * Responsibilities:
 * - Policy Assessment: Evaluates current taxation, treasury solvency, and public harmony
 * - Planner: Proposes adaptive legislative resolutions and resource redistribution plans
 * - Crisis Mitigation: Recommends specific interventions during disasters, deficits, or recessions
 *
 * Selective AI Invocation:
 * Invoked on council session milestones, deficit alerts, or direct user governance inquiries.
 */
export class GovernmentAI {
  /**
   * @param {Object} [config]
   */
  constructor(config = {}) {
    this.id = config.id || 'gov_council_ai';
    this.name = config.name || 'Technocratic Council Advisory AI';
    this.aiProvider = config.aiProvider || new AIProviderFactory().getProvider();
    this.memoryManager = new MemoryManager({ embeddingProvider: this.aiProvider });
    this.retrievalService = new RetrievalService({ embeddingProvider: this.aiProvider });
  }

  /**
   * Evaluate civilization health and recommend policy adjustments.
   *
   * @param {Object} worldMetrics - Current metrics from WorldState
   * @param {Object} [activeEvents=[]]
   * @returns {Promise<Object>} Policy advice and projected impacts
   */
  async evaluateGovernance(worldMetrics, activeEvents = []) {
    const prompt = [
      {
        role: 'system',
        content: `You are the Government AI Advisory Engine for NEURAL CITY.
Analyze the following governance KPIs:
- Population: ${worldMetrics.population}
- Stability: ${worldMetrics.stability}/100
- Happiness: ${worldMetrics.happiness}/100
- Crime Rate: ${worldMetrics.crimeRate}%
- Treasury: ${worldMetrics.treasury} NC
- Tax Rate: ${worldMetrics.taxRate}
- Deficits: ${JSON.stringify(worldMetrics.deficits || {})}
- Active Events: ${JSON.stringify(activeEvents.map((e) => e.title || e.type))}
Provide strategic governance advice. Return valid JSON with: { assessment, recommendations, suggestedTaxRate, projectedImpact }.`,
      },
      {
        role: 'user',
        content: 'Formulate an actionable municipal policy directive for the City Council.',
      },
    ];

    const result = await this.aiProvider.complete(prompt);

    try {
      const parsed = JSON.parse(result.text);
      return {
        ...parsed,
        source: result.fallback ? 'deterministic_rule_engine' : 'llm_cognitive_assistant',
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        assessment: 'Municipal operations within standard equilibrium limits. Fiscal prudence advised.',
        recommendations: [
          'Maintain balanced taxation to avoid household hardship.',
          'Bolster utility production to counter resource depletion.',
          'Subsidize civic guilds to reinforce stability index.',
        ],
        suggestedTaxRate: worldMetrics.taxRate || 0.15,
        projectedImpact: 'Sustained stability above 80 points.',
        source: 'deterministic_rule_engine',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Formulate emergency response during critical disasters or market crises.
   *
   * @param {Object} disasterDetails
   * @param {Object} worldStateSnapshot
   * @returns {Promise<Object>}
   */
  async planEmergencyResponse(disasterDetails, worldStateSnapshot) {
    const prompt = `CRITICAL CIVIC ALERT in NEURAL CITY:
Disaster: ${disasterDetails.title || disasterDetails.type}
Severity: ${disasterDetails.severity || 'HIGH'}
Provide emergency council response protocol in JSON with { priorityActions, resourceAllocationStrategy, citizenGuidance }.`;

    const result = await this.aiProvider.complete(prompt);

    try {
      const parsed = JSON.parse(result.text);
      return {
        ...parsed,
        source: result.fallback ? 'deterministic_rule_engine' : 'llm_cognitive_assistant',
      };
    } catch {
      return {
        priorityActions: [
          'Reroute emergency power relays from secondary industrial sectors.',
          'Release strategic grain and water reserves to vulnerable districts.',
          'Mobilize guild engineers for rapid infrastructure repair.',
        ],
        resourceAllocationStrategy: 'Allocate 20% of treasury surplus to immediate relief.',
        citizenGuidance: 'Remain near designated arcology shelter zones and conserve power.',
        source: 'deterministic_rule_engine',
      };
    }
  }
}

export default GovernmentAI;
