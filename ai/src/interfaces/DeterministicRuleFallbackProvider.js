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

    // 1. Citizen AI Reasoning / Reflection
    if (lower.includes('citizen') || lower.includes('reflection') || lower.includes('personal plan')) {
      return {
        text: JSON.stringify({
          reflection: 'Recent events have altered my priorities. I must balance my basic needs with long-term financial security and maintain close ties with my community.',
          mood: 'determined',
          priorityGoal: 'Maintain economic self-sufficiency and foster neighborhood bonds',
          suggestedAction: 'Work consistent hours and allocate disposable savings to mutual aid.',
          confidence: 0.88,
        }),
        raw: { model: 'fallback-rules-v1', mode: 'citizen' },
        usage: { promptTokens: promptStr.length, completionTokens: 48, totalTokens: promptStr.length + 48 },
        fallback: true,
      };
    }

    // 2. Government Policy / Governance AI
    if (lower.includes('government') || lower.includes('policy') || lower.includes('council')) {
      return {
        text: JSON.stringify({
          assessment: 'Civic indicators reflect balanced stability with localized resource and employment sensitivities.',
          recommendations: [
            'Adjust municipal tax rate dynamically to preserve treasury reserves while supporting low-income households.',
            'Target industrial and utility subsidies to resolve critical bottlenecks in energy and potable water.',
            'Fund community mutual aid programs to bolster social cohesion and elevate citizen satisfaction.',
          ],
          projectedImpact: 'Estimated +4% increase in civilization stability over 100 ticks.',
          confidence: 0.92,
        }),
        raw: { model: 'fallback-rules-v1', mode: 'government' },
        usage: { promptTokens: promptStr.length, completionTokens: 64, totalTokens: promptStr.length + 64 },
        fallback: true,
      };
    }

    // 3. Analyst AI Simulation Telemetry / Forecast
    if (lower.includes('analyst') || lower.includes('telemetry') || lower.includes('diagnostic')) {
      return {
        text: JSON.stringify({
          executiveSummary: 'Simulation metrics demonstrate healthy systemic equilibrium across population dynamics, resource consumption, and market pricing.',
          keyRisks: [
            'Potential inflation drift if agricultural or energy deficits persist beyond safety reserves.',
            'Labor market tightness in technical occupations.',
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
