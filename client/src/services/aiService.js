import api from './api.js';

/**
 * Frontend client service for Phase 9 AI assistants
 */
export const aiService = {
  /**
   * Request citizen cognitive reflection and memory synthesis
   */
  async getCitizenReflection(citizenId, payload = {}) {
    try {
      const res = await api.post(`/ai/citizen/${citizenId}/reflect`, payload);
      return { success: true, data: res.data.data };
    } catch (err) {
      return {
        success: false,
        data: {
          reflection: 'Citizen is quietly reflecting on everyday tasks and adapting to local conditions.',
          mood: 'calm',
          source: 'client_offline_fallback',
        },
        error: err.message,
      };
    }
  },

  /**
   * Request citizen long-term career / personal advancement plan
   */
  async getCitizenPlan(citizenId, payload = {}) {
    try {
      const res = await api.post(`/ai/citizen/${citizenId}/plan`, payload);
      return { success: true, data: res.data.data };
    } catch (err) {
      return {
        success: false,
        data: {
          planTitle: 'Autonomous Self-Sustenance',
          steps: ['Continue regular work cycle', 'Conserve energy reserves', 'Maintain neighborly trust'],
          source: 'client_offline_fallback',
        },
        error: err.message,
      };
    }
  },

  /**
   * Request Government AI council policy evaluation
   */
  async evaluateGovernmentPolicy(metrics, activeEvents = []) {
    try {
      const res = await api.post('/ai/government/evaluate', { metrics, activeEvents });
      return { success: true, data: res.data.data };
    } catch (err) {
      return {
        success: false,
        data: {
          assessment: 'Civic parameters stable. Automated governance routines maintaining public services.',
          recommendations: ['Monitor critical utility reserves', 'Maintain tax stability'],
          source: 'client_offline_fallback',
        },
        error: err.message,
      };
    }
  },

  /**
   * Request systemic diagnostic report from Analyst AI
   */
  async getSystemDiagnostics(metrics, economy, social = {}) {
    try {
      const res = await api.post('/ai/analyst/diagnostics', { metrics, economy, social });
      return { success: true, data: res.data.data };
    } catch (err) {
      return {
        success: false,
        data: {
          executiveSummary: 'Simulation telemetry indicates balanced operational stability.',
          systemHealthScore: 85,
          source: 'client_offline_fallback',
        },
        error: err.message,
      };
    }
  },
};

export default aiService;
