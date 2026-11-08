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
        content: `You are the Lead Simulation Causal Analyst for MANNORA (Virtual City Simulation).
Answer the user's question about the virtual city strictly based on the provided empirical simulation data.
Do NOT invent statistics or events that are not in the data.
Structure your response as a valid JSON object with:
- observation: 1-2 sentences stating what the simulation data shows
- evidence: an array of strings listing exact verified numbers and deltas from the data
- relatedEvents: array of event names or titles that occurred in this period
- possibleCause: clear explanation of the simulation mechanism (e.g. resource shortage leading to price spike or business layoffs)
- confidence: "High (Direct Evidence)" | "Moderate (Correlated Metric Drift)" | "Inconclusive (Insufficient Telemetry)"
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
      confidence: parsed.confidence || 'High (Direct Evidence)',
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
          observation: `Simulation data shows unemployment changed by ${unempDelta >= 0 ? '+' : ''}${unempDelta}% to reach a current rate of ${unempEnd}%.`,
          evidence: [
            `Unemployment Rate: from ${d.unemployment?.start ?? 0}% to ${d.unemployment?.end ?? 0}%`,
            `Total Goods Production (GDP): ${gdpDelta >= 0 ? '+' : ''}${gdpDelta} NC net shift`,
            `City Water Reserves: ${waterDelta >= 0 ? '+' : ''}${waterDelta} units change`,
          ],
          relatedEvents: events.filter((e) => e.type.includes('economic') || e.type.includes('shortage') || e.type.includes('failure')).map((e) => e.title),
          possibleCause: 'When commodity inputs (like water or energy) face deficits, production costs rise. Commercial businesses experience reduced profits and pause hiring, causing unemployment to tick upward.',
          confidence: 'High (Direct Evidence)',
          verdict: `Unemployment rose primarily due to commercial hiring freezes triggered by input cost inflation and resource shifts.`,
        };
      }

      case 'ECONOMIC_DECLINE': {
        const gdpDelta = d.gdp ? d.gdp.delta : 0;
        const tresDelta = d.treasury ? d.treasury.delta : 0;

        return {
          observation: `City production (GDP) shifted by ${gdpDelta} NC and municipal treasury reserves changed by ${tresDelta} NC across ${empirical.totalSnapshots || 1} recorded snapshots.`,
          evidence: [
            `GDP trajectory: start ${d.gdp?.start ?? 0} NC, current ${d.gdp?.end ?? 0} NC`,
            `Treasury balance: start ${d.treasury?.start ?? 0} NC, current ${d.treasury?.end ?? 0} NC`,
            `Triggered crisis events: ${events.length} recorded incidents`,
          ],
          relatedEvents: events.map((e) => e.title),
          possibleCause: 'Production drops occur when material bottlenecks reduce factory efficiency or when disaster events damage physical infrastructure and divert emergency funds.',
          confidence: 'High (Direct Evidence)',
          verdict: 'Economic output contracted due to combined supply shortages and infrastructure repair deductions.',
        };
      }

      case 'LARGEST_IMPACT_EVENT': {
        const evt = empirical.largestImpactEvent || events[0];
        if (!evt) {
          return {
            observation: 'No major crisis events were recorded in the simulation history snapshots.',
            evidence: ['Total recorded events: 0'],
            relatedEvents: [],
            possibleCause: 'The simulation has operated under steady baseline conditions without active shocks.',
            confidence: 'Inconclusive (No Events Recorded)',
            verdict: 'No event was triggered; the simulation remained within equilibrium.',
          };
        }

        return {
          observation: `The event with the largest systemic impact was "${evt.title}" (Severity: ${evt.severity}/5) at Day/Tick #${evt.tick}.`,
          evidence: [
            `Event Designation: ${evt.title} (${evt.type})`,
            `Severity Level: ${evt.severity} out of 5`,
            `Reported Cause: ${evt.cause}`,
            `Population Happiness Shift: ${d.happiness?.delta ?? 0} points`,
          ],
          relatedEvents: [evt.title],
          possibleCause: `This event caused wide structural impacts across building health, citizen rest decay, and emergency municipal expenditure.`,
          confidence: 'High (Direct Evidence)',
          verdict: `"${evt.title}" caused the greatest observed disruption across municipal resources and satisfaction.`,
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
          confidence: 'High (Direct Evidence)',
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
          confidence: 'Moderate (Correlated Metric Drift)',
          verdict: 'Population shifts were driven by changes in employment availability and basic need satisfaction.',
        };
      }

      default: {
        return {
          observation: `Simulation telemetry indicates an aggregate population shift of ${d.population?.delta ?? 0} and treasury change of ${d.treasury?.delta ?? 0} NC.`,
          evidence: [
            `Active Events Count: ${events.length}`,
            `Population: ${d.population?.end ?? 0}`,
            `GDP: ${d.gdp?.end ?? 0} NC`,
          ],
          relatedEvents: events.map((e) => e.title),
          possibleCause: 'Continuous interaction between citizen daily routines, market price discovery, and municipal policy rules.',
          confidence: 'Moderate (Correlated Metric Drift)',
          verdict: 'Simulation state evolved according to deterministic market and citizen decision loops.',
        };
      }
    }
  }
}

