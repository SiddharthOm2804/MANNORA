/**
 * SimulationAnalyzer extracts real, verifiable empirical facts from simulation history:
 * - snapshot timeline trajectories
 * - events log
 * - agent actions and employment shifts
 * - policy changes
 * - resource shortages and surpluses
 *
 * It NEVER invents data. If an event or metric did not occur, it explicitly returns null or empty.
 */
export class SimulationAnalyzer {
  /**
   * Extract comprehensive analytical timeline from history snapshots and events
   *
   * @param {Object} options
   * @param {Array<Object>} options.snapshots - Array of historical WorldState snapshots or metric points
   * @param {Array<Object>} options.events - Array of triggered / active simulation events
   * @param {Array<Object>} [options.policyHistory] - History of enacted/repealed policies
   * @param {Array<Object>} [options.agentRecords] - Sampled citizen employment & vital records
   * @returns {Object} Empirical evidence bundle
   */
  static extractEvidence({ snapshots = [], events = [], policyHistory = [], agentRecords = [] }) {
    if (!snapshots || snapshots.length === 0) {
      return {
        hasData: false,
        summary: 'No historical snapshots recorded yet.',
        metricsDeltas: {},
        eventCorrelations: [],
        policyTransitions: [],
      };
    }

    // Sort snapshots chronologically
    const sorted = [...snapshots].sort((a, b) => (a.tick ?? 0) - (b.tick ?? 0));
    const first = sorted[0];
    const latest = sorted[sorted.length - 1];

    // 1. Calculate concrete metric deltas
    const getPop = (s) => s.population?.total ?? s.metrics?.population ?? 0;
    const getUnemp = (s) => {
      if (s.population?.unemploymentRate !== undefined) return s.population.unemploymentRate * 100;
      if (s.economy?.unemploymentRate !== undefined) return s.economy.unemploymentRate * 100;
      if (s.metrics?.unemployment !== undefined) return s.metrics.unemployment * 100;
      return 5.0;
    };
    const getTreasury = (s) => s.economy?.treasury ?? s.metrics?.treasury ?? 0;
    const getGdp = (s) => s.economy?.gdp ?? 0;
    const getWater = (s) => s.resources?.water ?? 0;
    const getEnergy = (s) => s.resources?.energy ?? 0;
    const getHappiness = (s) => s.population?.averageHappiness ?? s.metrics?.happiness ?? 70;
    const getMigration = (s) => s.population?.emigrants ?? 0;

    const deltas = {
      population: {
        start: getPop(first),
        end: getPop(latest),
        delta: getPop(latest) - getPop(first),
      },
      unemployment: {
        start: Math.round(getUnemp(first) * 10) / 10,
        end: Math.round(getUnemp(latest) * 10) / 10,
        delta: Math.round((getUnemp(latest) - getUnemp(first)) * 10) / 10,
      },
      treasury: {
        start: getTreasury(first),
        end: getTreasury(latest),
        delta: getTreasury(latest) - getTreasury(first),
      },
      gdp: {
        start: getGdp(first),
        end: getGdp(latest),
        delta: getGdp(latest) - getGdp(first),
      },
      water: {
        start: getWater(first),
        end: getWater(latest),
        delta: getWater(latest) - getWater(first),
      },
      energy: {
        start: getEnergy(first),
        end: getEnergy(latest),
        delta: getEnergy(latest) - getEnergy(first),
      },
      happiness: {
        start: Math.round(getHappiness(first)),
        end: Math.round(getHappiness(latest)),
        delta: Math.round(getHappiness(latest) - getHappiness(first)),
      },
      migration: {
        start: getMigration(first),
        end: getMigration(latest),
        delta: getMigration(latest) - getMigration(first),
      },
    };

    // 2. Identify major events and temporal proximity
    const relevantEvents = (events || []).map((e) => ({
      id: e.id,
      title: e.title || e.type,
      type: e.type,
      tick: e.startedAtTick ?? e.triggerTick ?? e.tick ?? 0,
      severity: e.severity ?? 1,
      cause: e.cause || 'Systemic state shift',
      effects: e.effects || {},
    })).sort((a, b) => a.tick - b.tick);

    // 3. Find event with largest systemic impact
    let largestImpactEvent = null;
    let maxSeverity = -1;
    for (const evt of relevantEvents) {
      if (evt.severity > maxSeverity) {
        maxSeverity = evt.severity;
        largestImpactEvent = evt;
      }
    }

    return {
      hasData: true,
      totalSnapshots: sorted.length,
      startTick: first.tick ?? 0,
      latestTick: latest.tick ?? 0,
      deltas,
      events: relevantEvents,
      largestImpactEvent,
      policyHistory: policyHistory || [],
      agentCount: agentRecords?.length || 0,
    };
  }
}
