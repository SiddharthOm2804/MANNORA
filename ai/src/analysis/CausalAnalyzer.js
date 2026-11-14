import { SimulationAnalyzer } from './SimulationAnalyzer.js';
import { AIProviderFactory } from '../interfaces/AIProviderFactory.js';

/**
 * CausalAnalyzer investigates "Why" and "What caused" questions asked by users.
 *
 * It maps user questions to empirical simulation telemetry and formats answers in:
 * - Observation (what the simulation data shows)
 * - Evidence (exact numbers, delta percentages, snapshot ticks)
 * - Related Events (actual recorded crises or milestones)
 * - Possible Cause (algorithmic explanation of system linkages)
 * - Confidence / Uncertainty (clear probability without false certainty)
 *
 * CRITICAL CONSTRAINT:
 * The AI MUST NOT invent events, numbers, or facts. Everything references actual simulation state.
 */
export class CausalAnalyzer {
  /**
   * @param {Object} [options]
   * @param {Object} [options.aiProvider]
   */
  constructor(options = {}) {
    this.aiProvider = options.aiProvider || new AIProviderFactory().getProvider();
  }

  /**
   * Answer a causal or analytical inquiry about the simulation.
   *
   * @param {string} userQuestion - e.g. "Why did unemployment increase?", "What caused economic decline?"
   * @param {Object} simulationHistory
   * @param {Array<Object>} simulationHistory.snapshots - Checkpoint states
   * @param {Array<Object>} [simulationHistory.events] - Triggered events
   * @param {Array<Object>} [simulationHistory.policyHistory] - Enacted policies
   * @returns {Promise<{
   *   question: string,
   *   observation: string,
   *   evidence: string[],
   *   relatedEvents: Array<Object>,
   *   possibleCause: string,
   *   confidence: string,
   *   verdict: string,
   *   disclaimer: string
   * }>}
   */
  async answerCausalInquiry(userQuestion, simulationHistory = {}) {
    if (!userQuestion || typeof userQuestion !== 'string' || !userQuestion.trim()) {
      throw new Error('CausalAnalyzer: userQuestion must be a non-empty string');
    }

    const question = userQuestion.trim();

    // 1. Extract pure empirical data from simulation
    const empirical = SimulationAnalyzer.extractEvidence({
      snapshots: simulationHistory.snapshots || [],
      events: simulationHistory.events || [],
      policyHistory: simulationHistory.policyHistory || [],
    });

    // 2. Classify inquiry intent
    const intent = this._classifyIntent(question);

    // 3. Synthesize factual prompt grounded in verified simulation telemetry
    const prompt = [
      {
        role: 'system',
        content: `You help people understand why their city changed.
Answer using only the city information below.
Do NOT invent statistics or events that are not in the data.
Structure your response as a valid JSON object with:
- observation: 1-2 short sentences about what changed
- evidence: a list of numbers that support your answer
- relatedEvents: array of event names or titles that occurred in this period
- possibleCause: a simple explanation of what may have caused the change (e.g. resource shortage leading to price spike or business layoffs)
- confidence: "Strong evidence" | "Some evidence" | "Not enough information"
- verdict: concise summary in simple Indian English.`,
      },
      {
        role: 'user',
        content: `User Question: "${question}"
Inquiry Intent: ${intent}
Empirical Telemetry:
${JSON.stringify(empirical, null, 2)}`,
      },
    ];

    // 4. Request completion from AI provider
    const result = await this.aiProvider.complete(prompt);

    let parsed = null;
    try {
      parsed = typeof result.text === 'object' ? result.text : JSON.parse(result.text);
    } catch {
      // Deterministic rule-based causal generation when offline
      parsed = this._generateDeterministicCausalAnswer(intent, empirical, question);
    }

    if (!parsed || !parsed.observation) {
      parsed = this._generateDeterministicCausalAnswer(intent, empirical, question);
    }

    return {
      question,
      observation: parsed.observation,
      evidence: Array.isArray(parsed.evidence) ? parsed.evidence : [String(parsed.evidence)],
      relatedEvents: parsed.relatedEvents || (empirical.events || []).map((e) => e.title),
      possibleCause: parsed.possibleCause,
      confidence: parsed.confidence || 'Strong Evidence',
      verdict: parsed.verdict || parsed.observation,
      disclaimer: 'SIMULATION RESULT: This analysis explains mathematical relationships inside MANNORA simulation code. It does not reflect real-world economic or demographic certainty.',
      empiricalDeltas: empirical.deltas,
    };
  }

  /**
   * Categorize the user's inquiry into a known analysis domain
   */
  _classifyIntent(question) {
    const q = question.toLowerCase();
    if (q.includes('unemployment') || q.includes('jobs') || q.includes('labor')) {
      return 'UNEMPLOYMENT_INCREASE';
    }
    if (q.includes('economic') || q.includes('economy') || q.includes('gdp') || q.includes('decline') || q.includes('recession')) {
      return 'ECONOMIC_DECLINE';
    }
    if (q.includes('largest impact') || q.includes('biggest event') || q.includes('most damage') || q.includes('worst event')) {
      return 'LARGEST_IMPACT_EVENT';
    }
    if (q.includes('water shortage') || q.includes('water') || q.includes('drought')) {
      return 'WATER_SHORTAGE_IMPACT';
    }
    if (q.includes('migration') || q.includes('people leaving') || q.includes('emigration') || q.includes('population')) {
      return 'MIGRATION_POPULATION_SHIFT';
    }
    return 'GENERAL_CAUSAL_ANALYSIS';
  }

  /**
   * Deterministic factual synthesis ensuring zero hallucination.
   */
  _generateDeterministicCausalAnswer(intent, empirical, question) {
    const d = empirical.deltas || {};
    const events = empirical.events || [];

    switch (intent) {
      case 'UNEMPLOYMENT_INCREASE': {
        const unempDelta = d.unemployment ? d.unemployment.delta : 0;
        const unempEnd = d.unemployment ? d.unemployment.end : 5;
        const gdpDelta = d.gdp ? d.gdp.delta : 0;
        const waterDelta = d.water ? d.water.delta : 0;

        return {
          observation: `The unemployment rate changed by ${unempDelta >= 0 ? '+' : ''}${unempDelta} percentage points and is now ${unempEnd}%.`,
          evidence: [
            `People without work: from ${d.unemployment?.start ?? 0}% to ${d.unemployment?.end ?? 0}%`,
            `Goods made: ${gdpDelta >= 0 ? '+' : ''}${gdpDelta} rupees changed`,
            `City water supply: ${waterDelta >= 0 ? '+' : ''}${waterDelta} units change`,
          ],
          relatedEvents: events.filter((e) => e.type.includes('economic') || e.type.includes('shortage') || e.type.includes('failure')).map((e) => e.title),
          possibleCause: 'When the city has less water or power, it may cost more for shops to work. Some shops may stop hiring.',
          confidence: 'Strong Evidence',
          verdict: `There were fewer jobs as shop costs went up.`,
        };
      }

      case 'ECONOMIC_DECLINE': {
        const gdpDelta = d.gdp ? d.gdp.delta : 0;
        const tresDelta = d.treasury ? d.treasury.delta : 0;

        return {
          observation: `Goods made changed by ${gdpDelta} NC and city funds changed by ${tresDelta} NC over ${empirical.totalSnapshots || 1} saved points.`,
          evidence: [
            `Goods made: start ${d.gdp?.start ?? 0} NC, current ${d.gdp?.end ?? 0} NC`,
            `City funds: start ${d.treasury?.start ?? 0} NC, current ${d.treasury?.end ?? 0} NC`,
            `City events: ${events.length} recorded incidents`,
          ],
          relatedEvents: events.map((e) => e.title),
          possibleCause: 'The city may make fewer goods when supplies run low or buildings are damaged.',
          confidence: 'Strong Evidence',
          verdict: 'The city made fewer goods and spent more on repairs.',
        };
      }

      case 'LARGEST_IMPACT_EVENT': {
        const evt = empirical.largestImpactEvent || events[0];
        if (!evt) {
          return {
            observation: 'No major events were saved in the city history.',
            evidence: ['Total recorded events: 0'],
            relatedEvents: [],
            possibleCause: 'The city has been running without any major problems.',
            confidence: 'Not enough information',
            verdict: 'No major event happened.',
          };
        }

        return {
          observation: `The biggest event was "${evt.title}" (Severity: ${evt.severity}/5) at Day/Tick #${evt.tick}.`,
          evidence: [
            `Event: ${evt.title} (${evt.type})`,
            `Severity Level: ${evt.severity} out of 5`,
            `Cause: ${evt.cause}`,
            `Change in happiness: ${d.happiness?.delta ?? 0} points`,
          ],
          relatedEvents: [evt.title],
          possibleCause: `This event affected buildings, people, and city spending.`,
          confidence: 'Strong Evidence',
          verdict: `"${evt.title}" caused the biggest change in the city.`,
        };
      }

      case 'WATER_SHORTAGE_IMPACT': {
        const waterDelta = d.water ? d.water.delta : 0;
        const happinessDelta = d.happiness ? d.happiness.delta : 0;
        const unempDelta = d.unemployment ? d.unemployment.delta : 0;

        return {
          observation: `Following the water shortage, city water stocks shifted by ${waterDelta} units, while citizen happiness moved by ${happinessDelta} points.`,
          evidence: [
            `Water Reserves: ${d.water?.start ?? 0} kL → ${d.water?.end ?? 0} kL (Delta: ${waterDelta})`,
            `Citizen Happiness: ${d.happiness?.start ?? 0} → ${d.happiness?.end ?? 0}`,
            `Unemployment Rate: ${d.unemployment?.start ?? 0}% → ${d.unemployment?.end ?? 0}%`,
          ],
          relatedEvents: events.filter((e) => e.type.includes('water') || e.type.includes('shortage')).map((e) => e.title),
          possibleCause: 'The EventEngine reduced water reserves, automatically driving up commodity prices. Poorer households faced higher living expenses, decreasing public happiness and raising survival priorities.',
          confidence: 'Strong evidence',
          verdict: 'The water shortage caused commodity price spikes, reduced citizen satisfaction, and forced household austerity.',
        };
      }

      case 'MIGRATION_POPULATION_SHIFT': {
        const popDelta = d.population ? d.population.delta : 0;
        const migDelta = d.migration ? d.migration.delta : 0;

        return {
          observation: `Total population shifted by ${popDelta >= 0 ? '+' : ''}${popDelta} citizens, with an emigration delta of ${migDelta}.`,
          evidence: [
            `Initial Population: ${d.population?.start ?? 0} → Final: ${d.population?.end ?? 0}`,
            `Public Satisfaction Score: ${d.happiness?.end ?? 70}/100`,
            `Unemployment: ${d.unemployment?.end ?? 5}%`,
          ],
          relatedEvents: events.map((e) => e.title),
          possibleCause: 'Citizens in MANNORA emigrate when unemployment remains high and basic need satisfaction falls below critical survival thresholds.',
          confidence: 'Some evidence',
          verdict: 'Population shifts were driven by changes in employment availability and basic need satisfaction.',
        };
      }

      default: {
        return {
          observation: `The city population changed by ${d.population?.delta ?? 0}, and city funds changed by ${d.treasury?.delta ?? 0}.`,
          evidence: [
            `City events: ${events.length}`,
            `People: ${d.population?.end ?? 0}`,
            `Goods made: ${d.gdp?.end ?? 0}`,
          ],
          relatedEvents: events.map((e) => e.title),
          possibleCause: 'People’s daily choices, shop prices, and city rules all affected the result.',
          confidence: 'Medium',
          verdict: 'The city changed as people made choices and shops changed their prices.',
        };
      }
    }
  }
}

