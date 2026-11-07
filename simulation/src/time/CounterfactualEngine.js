import { SimulationEngine } from '../core/SimulationEngine.js';
import { WorldState } from '../core/WorldState.js';

/**
 * CounterfactualEngine manages running comparative simulations across branches.
 * Runs both the baseline (or reference) simulation and a counterfactual branch,
 * then computes structured mathematical divergence metrics across:
 * - Population (total, health, happiness, mortality, births)
 * - Economy (treasury, GDP, tax revenue, inflation)
 * - Resource levels (energy, water, minerals, agriculture, technology)
 * - Unemployment (employed, unemployed, rate delta)
 * - Public satisfaction (civic approval rating, stability index)
 * - Major events (crises triggered vs avoided)
 */
export class CounterfactualEngine {
  /**
   * @param {Object} [options]
   */
  constructor(options = {}) {
    this.options = options;
  }

  /**
   * Run and compare a baseline simulation and a counterfactual branch over N ticks.
   *
   * @param {Object} params
   * @param {WorldState|Object} params.baselineState - Initial reference state
   * @param {WorldState|Object} params.branchState - Forked counterfactual state with interventions
   * @param {number} [params.ticks=20] - Number of ticks to step both simulations
   * @param {number} [params.seed=42] - Seed for identical deterministic background noise
   * @returns {Object} Comprehensive comparative analysis report
   */
  runComparison(params = {}) {
    const {
      baselineState,
      branchState,
      ticks = 20,
      seed = 42,
    } = params;

    if (!baselineState || !branchState) {
      throw new Error('CounterfactualEngine.runComparison: Both baselineState and branchState are required');
    }

    // 1. Create two isolated SimulationEngines with IDENTICAL seed and subsystems
    const baselineEngine = new SimulationEngine({ seed, tickRate: 10, maxHistory: 100 });
    const branchEngine = new SimulationEngine({ seed, tickRate: 10, maxHistory: 100 });

    const baseInit = baselineState instanceof WorldState
      ? baselineState.clone()
      : WorldState.deserialize(baselineState);

    const branchInit = branchState instanceof WorldState
      ? branchState.clone()
      : WorldState.deserialize(branchState);

    baselineEngine.stateManager.restoreState(baseInit);
    branchEngine.stateManager.restoreState(branchInit);

    baselineEngine.clock.currentTick = baseInit.tick;
    branchEngine.clock.currentTick = branchInit.tick;

    baselineEngine.isInitialized = true;
    branchEngine.isInitialized = true;

    // Timeline series for delta chart plotting
    const timelineSeries = [];

    // Record initial step 0
    timelineSeries.push({
      step: 0,
      baselineTick: baseInit.tick,
      branchTick: branchInit.tick,
      baseline: this._extractKpis(baseInit),
      branch: this._extractKpis(branchInit),
    });

    // 2. Step both engines in parallel lockstep
    for (let i = 1; i <= ticks; i++) {
      const baseNext = baselineEngine.step();
      const branchNext = branchEngine.step();

      timelineSeries.push({
        step: i,
        baselineTick: baseNext.tick,
        branchTick: branchNext.tick,
        baseline: this._extractKpis(baseNext),
        branch: this._extractKpis(branchNext),
      });
    }

    const finalBaseline = baselineEngine.stateManager.getCurrentState();
    const finalBranch = branchEngine.stateManager.getCurrentState();

    // 3. Compute Delta Analysis across all required dimensions
    const comparison = this.compareStates(finalBaseline, finalBranch);

    return {
      ticksEvaluated: ticks,
      seed,
      initialStates: {
        baseline: this._extractKpis(baseInit),
        branch: this._extractKpis(branchInit),
      },
      finalStates: {
        baseline: this._extractKpis(finalBaseline),
        branch: this._extractKpis(finalBranch),
      },
      comparison,
      timelineSeries,
    };
  }

  /**
   * Compare two static WorldState instances and compute exact quantitative divergence deltas.
   *
   * @param {WorldState} baseline
   * @param {WorldState} branch
   * @returns {Object} Structured comparison
   */
  compareStates(baseline, branch) {
    const baseKpis = this._extractKpis(baseline);
    const branchKpis = this._extractKpis(branch);

    return {
      population: {
        baseline: baseKpis.population,
        branch: branchKpis.population,
        delta: branchKpis.population - baseKpis.population,
        percentDelta: this._percent(baseKpis.population, branchKpis.population),
        healthDelta: branchKpis.health - baseKpis.health,
        happinessDelta: branchKpis.happiness - baseKpis.happiness,
      },
      economy: {
        treasury: {
          baseline: baseKpis.treasury,
          branch: branchKpis.treasury,
          delta: Number((branchKpis.treasury - baseKpis.treasury).toFixed(2)),
          percentDelta: this._percent(baseKpis.treasury, branchKpis.treasury),
        },
        gdp: {
          baseline: baseKpis.gdp,
          branch: branchKpis.gdp,
          delta: Number((branchKpis.gdp - baseKpis.gdp).toFixed(2)),
        },
        inflation: {
          baseline: baseKpis.inflation,
          branch: branchKpis.inflation,
          delta: Number((branchKpis.inflation - baseKpis.inflation).toFixed(4)),
        },
      },
      resources: {
        water: {
          baseline: baseKpis.resources.water,
          branch: branchKpis.resources.water,
          delta: Number((branchKpis.resources.water - baseKpis.resources.water).toFixed(2)),
        },
        energy: {
          baseline: baseKpis.resources.energy,
          branch: branchKpis.resources.energy,
          delta: Number((branchKpis.resources.energy - baseKpis.resources.energy).toFixed(2)),
        },
        minerals: {
          baseline: baseKpis.resources.minerals,
          branch: branchKpis.resources.minerals,
          delta: Number((branchKpis.resources.minerals - baseKpis.resources.minerals).toFixed(2)),
        },
        agriculture: {
          baseline: baseKpis.resources.agriculture,
          branch: branchKpis.resources.agriculture,
          delta: Number((branchKpis.resources.agriculture - baseKpis.resources.agriculture).toFixed(2)),
        },
        technology: {
          baseline: baseKpis.resources.technology,
          branch: branchKpis.resources.technology,
          delta: Number((branchKpis.resources.technology - baseKpis.resources.technology).toFixed(2)),
        },
      },
      unemployment: {
        baselineRate: baseKpis.unemploymentRate,
        branchRate: branchKpis.unemploymentRate,
        delta: Number((branchKpis.unemploymentRate - baseKpis.unemploymentRate).toFixed(3)),
        employedDelta: branchKpis.employed - baseKpis.employed,
      },
      publicSatisfaction: {
        baselineScore: baseKpis.civicApproval,
        branchScore: branchKpis.civicApproval,
        delta: branchKpis.civicApproval - baseKpis.civicApproval,
        stabilityDelta: branchKpis.stability - baseKpis.stability,
      },
      majorEvents: {
        baselineActive: baseline.getActiveEvents().map((e) => e.title || e.type),
        branchActive: branch.getActiveEvents().map((e) => e.title || e.type),
        baselineHistoryCount: baseline.getEventLog().length,
        branchHistoryCount: branch.getEventLog().length,
      },
    };
  }

  /**
   * Extract unified KPIs from a WorldState instance
   * @private
   */
  _extractKpis(state) {
    const pop = state.population || {};
    const econ = state.economy || {};
    const res = state.resources || {};
    const metrics = state.metrics || {};
    const gov = metrics.government || {};

    return {
      tick: state.tick,
      population: pop.total || 0,
      employed: pop.employed || 0,
      unemployed: pop.unemployed || 0,
      unemploymentRate: pop.unemploymentRate ?? 0.05,
      health: pop.health || 0,
      happiness: pop.happiness || 0,
      treasury: econ.treasury || 0,
      gdp: econ.gdp || 0,
      inflation: econ.inflationRate || 0,
      civicApproval: gov.civicApprovalScore ?? 75,
      stability: metrics.stability ?? 80,
      qualityOfLife: metrics.qualityOfLife ?? 75,
      resources: {
        water: res.water?.current ?? 0,
        energy: res.energy?.current ?? 0,
        minerals: res.minerals?.current ?? 0,
        agriculture: res.agriculture?.current ?? 0,
        technology: res.technology?.current ?? 0,
      },
    };
  }

  /**
   * Calculate percentage delta
   * @private
   */
  _percent(base, target) {
    if (base === 0) return target === 0 ? 0 : 100;
    return Number((((target - base) / Math.abs(base)) * 100).toFixed(2));
  }
}

export default CounterfactualEngine;
