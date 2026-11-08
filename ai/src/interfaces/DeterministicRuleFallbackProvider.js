import { ILLMProvider } from '../interfaces/ILLMProvider.js';

/**
 * DeterministicRuleFallbackProvider serves as the resilient offline baseline.
 * When no external API key is set, or if an external LLM request fails/times out,
 * this provider generates coherent, structured, simulation-consistent outputs.
 */
export class DeterministicRuleFallbackProvider extends ILLMProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'rule-fallback';
  }

  /**
   * Generates a deterministic, rule-based completion based on prompt keywords & context.
   *
   * @param {string|Array<{ role: string, content: string }>} prompt
   * @param {Object} [options={}]
   * @returns {Promise<{ text: string, raw: any, usage: any, fallback: boolean }>}
   */
  async complete(prompt, options = {}) {
    const promptStr = typeof prompt === 'string'
      ? prompt
      : prompt.map((p) => p.content).join(' ');

    const lower = promptStr.toLowerCase();

    // 0. Natural Language World Creation / WorldPromptParser (Phase 14)
    if (lower.includes('world configuration architect') || lower.includes('create a') && lower.includes('civilization')) {
      // Deterministically parse attributes from prompt
      let pop = 20000;
      const popMatch = promptStr.match(/(\d[\d,]*)\s*(?:citizens|people|residents)/i);
      if (popMatch) {
        pop = parseInt(popMatch[1].replace(/,/g, ''), 10);
      }

      let citiesCount = 2;
      const cityMatch = promptStr.match(/(one|two|three|four|five|six|\d+)\s*(?:cities|municipalities)/i);
      if (cityMatch) {
        const wordMap = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };
        citiesCount = wordMap[cityMatch[1].toLowerCase()] || parseInt(cityMatch[1], 10) || 2;
      }

      const isDesert = lower.includes('desert') || lower.includes('arid');
      const isLimitedWater = lower.includes('limited water') || lower.includes('water scarcity') || lower.includes('scarce');

      return {
        text: JSON.stringify({
          name: isDesert ? 'Neo-Sahara Central Oasis' : 'New Horizon Autonomous Matrix',
          description: `A ${isDesert ? 'desert' : 'temperate'} civilization with ${pop.toLocaleString()} citizens, ${citiesCount} cities, and central government.`,
          population: pop,
          numberOfCities: citiesCount,
          biome: isDesert ? 'Desert' : 'Cybernetic Basin',
          governmentType: 'Central Government',
          resources: {
            water: isLimitedWater ? 1200 : 5000,
            energy: 5500,
            agriculture: lower.includes('agriculture') ? 4200 : 3000,
            minerals: 2800,
            technology: 1800,
          },
          startingMoney: 600000,
          taxRate: 0.15,
          industries: [
            'Synthetic Bio-Agriculture & Farming',
            'Commercial Trade & Markets',
            'Healthcare, Biotech & Clinics',
          ],
          publicServices: [
            'Municipal Hospitals & Healthcare Clinics',
            'Central Civil Administration',
            'Water Purification Grid',
          ],
        }),
        raw: { model: 'fallback-rules-v1', mode: 'world_generation' },
        usage: { promptTokens: promptStr.length, completionTokens: 96, totalTokens: promptStr.length + 96 },
        fallback: true,
      };
    }

    // 1. Government Policy / Governance AI
    if (lower.includes('government') || lower.includes('policy') || lower.includes('council')) {
      return {
        text: JSON.stringify({
          assessment: 'The city is currently stable, but we must watch resource supplies and worker salaries closely.',
          recommendations: [
            'Keep taxes fair so families have enough money to live comfortably while city funds stay healthy.',
            'Provide support to water and electricity utilities so supplies never run out.',
            'Support local community programs to keep public happiness and peace high.',
          ],
          projectedImpact: 'Estimated +4% increase in citizen satisfaction over the next 100 days.',
          confidence: 0.92,
        }),
        raw: { model: 'fallback-rules-v1', mode: 'government' },
        usage: { promptTokens: promptStr.length, completionTokens: 64, totalTokens: promptStr.length + 64 },
        fallback: true,
      };
    }

    // 2. Citizen AI Reasoning / Reflection
    if (lower.includes('citizen') || lower.includes('reflection') || lower.includes('personal plan')) {
      return {
        text: JSON.stringify({
          reflection: 'Recent events have changed my priorities. I need to make sure my basic needs are met, save some money, and stay in touch with friends and neighbors.',
          mood: 'determined',
          priorityGoal: 'Earn steady income and maintain good relationships with neighbors',
          suggestedAction: 'Work regular shifts at my job and save money for emergencies.',
          confidence: 0.88,
        }),
        raw: { model: 'fallback-rules-v1', mode: 'citizen' },
        usage: { promptTokens: promptStr.length, completionTokens: 48, totalTokens: promptStr.length + 48 },
        fallback: true,
      };
    }

    // 3. Analyst AI Simulation Telemetry / Forecast
    if (lower.includes('analyst') || lower.includes('telemetry') || lower.includes('diagnostic')) {
      return {
        text: JSON.stringify({
          executiveSummary: 'The city economy is running smoothly with steady goods production, fair prices, and stable population.',
          keyRisks: [
            'Market prices may increase if food or electricity stock drops too low.',
            'High demand for technical workers in factories.',
          ],
          systemHealthScore: 86,
          anomaliesDetected: 0,
        }),
        raw: { model: 'fallback-rules-v1', mode: 'analyst' },
        usage: { promptTokens: promptStr.length, completionTokens: 52, totalTokens: promptStr.length + 52 },
        fallback: true,
      };
    }

    // Generic Fallback
    return {
      text: JSON.stringify({
        status: 'OK',
        message: 'Deterministic rule engine response executed successfully.',
        timestamp: new Date().toISOString(),
      }),
      raw: { model: 'fallback-rules-v1', mode: 'generic' },
      usage: { promptTokens: promptStr.length, completionTokens: 20, totalTokens: promptStr.length + 20 },
      fallback: true,
    };
  }

  /**
   * Deterministic pseudo-embedding for text similarity.
   * Generates a 64-dimensional float vector hashed from character n-grams.
   *
   * @param {string|string[]} text
   * @returns {Promise<number[]|number[][]>}
   */
  async embed(text) {
    const generateVector = (str) => {
      const vec = new Array(64).fill(0);
      const s = String(str || '');
      for (let i = 0; i < s.length; i++) {
        const charCode = s.charCodeAt(i);
        const idx1 = (charCode + i) % 64;
        const idx2 = (charCode * 7 + i * 13) % 64;
        vec[idx1] += 0.15;
        vec[idx2] += 0.25;
      }
      // Normalize vector to unit length
      const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0)) || 1;
      return vec.map((v) => Number((v / norm).toFixed(4)));
    };

    if (Array.isArray(text)) {
      return text.map(generateVector);
    }
    return generateVector(text);
  }
}

export default DeterministicRuleFallbackProvider;
