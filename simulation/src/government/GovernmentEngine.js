import { PolicyEngine } from './PolicyEngine.js';
import { PublicServiceEngine } from './PublicServiceEngine.js';

/**
 * GovernmentEngine is the primary executive coordinator for civic governance in NEURAL CITY.
 *
 * Responsibilities:
 * - Controls taxation rates, budget expenditures, and infrastructure investment
 * - Enacts and repeals regulatory directives via PolicyEngine
 * - Directs operational funding across public services via PublicServiceEngine
 * - Computes simulated civic approval / government satisfaction metrics
 * - Records all policy transitions into world event history
 *
 * NOT a real-world political tool; purely a fictional, deterministic simulation model.
 */
export class GovernmentEngine {
  /**
   * @param {Object} [config]
   */
  constructor(config = {}) {
    this.policyEngine = new PolicyEngine(config.policyConfig || {});
    this.publicServiceEngine = new PublicServiceEngine(config.publicServiceConfig || {});

    this.civicApprovalScore = Number(config.civicApprovalScore ?? 78);
    this.approvalTrend = config.approvalTrend || 'stable';
  }

  /**
   * Pipeline update step: coordinates taxation intake, policy expenses, public service impacts,
   * and citizen approval computation.
   *
   * @param {import('../core/WorldState.js').WorldState} worldState
   * @param {number} delta
   * @param {import('../core/RandomEngine.js').RandomEngine} random
   * @param {Object} [clockInfo={}]
   */
  update(worldState, delta, random, clockInfo = {}) {
    const tick = clockInfo.tick ?? worldState.tick ?? 0;
    const econ = worldState.economy;
    const pop = worldState.population;

    // 1. Get aggregate policy modifiers and ongoing statutory costs
    const { totalCostPerTick: policyExpenses, modifiers: policyModifiers } =
      this.policyEngine.getAggregateModifiers();

    // 2. Update public services operational delivery
    this.publicServiceEngine.update(worldState, delta, policyModifiers);
    const serviceExpenses = this.publicServiceEngine.getTotalBudgetExpenditure();

    // 3. Fiscal Accounting: Deduct municipal expenditures from treasury
    const totalGovernmentExpenditure = policyExpenses + serviceExpenses;
    econ.treasury = Number(Math.max(0, econ.treasury - totalGovernmentExpenditure).toFixed(2));

    // 4. Update government metrics in WorldState
    const publicServiceSatisfaction = this.publicServiceEngine.getOverallSatisfaction();
    
    // Approval Rating formula:
    // Base 50 + Public Services (30%) + Happiness (30%) - Tax Penalty (20%) - Deficits (20%)
    const taxRate = econ.taxRate || 0.15;
    const taxPenalty = Math.max(0, (taxRate - 0.12) * 120);
    const deficits = worldState.metrics?.deficits || {};
    const deficitPenalty = (deficits.energy ? 12 : 0) + (deficits.water ? 15 : 0) + (deficits.agriculture ? 15 : 0);

    const rawApproval = (
      (publicServiceSatisfaction * 0.40) +
      (pop.happiness * 0.35) +
      (worldState.metrics?.stability ?? 80) * 0.25 -
      taxPenalty -
      deficitPenalty
    );

    const targetApproval = Math.max(10, Math.min(100, Math.round(rawApproval)));
    const prevApproval = this.civicApprovalScore;

    // Smooth transition
    this.civicApprovalScore = Math.round(this.civicApprovalScore * 0.85 + targetApproval * 0.15);
    this.approvalTrend = this.civicApprovalScore > prevApproval
      ? 'rising'
      : this.civicApprovalScore < prevApproval
      ? 'falling'
      : 'stable';

    // 5. Commit structured government metrics to WorldState
    worldState.metrics.government = {
      civicApprovalScore: this.civicApprovalScore,
      approvalTrend: this.approvalTrend,
      taxRate: econ.taxRate,
      treasury: econ.treasury,
      totalExpensesPerTick: totalGovernmentExpenditure,
      policyExpenses,
      serviceExpenses,
      activePoliciesCount: this.policyEngine.activePolicies.size,
      publicServiceSatisfaction,
      publicServices: this.publicServiceEngine.getPublicServicesSummary(),
      activePolicies: this.policyEngine.getActivePolicies(),
      recentPolicyHistory: this.policyEngine.policyHistory.slice(-5),
    };
  }

  /**
   * Legislative Action: Enact a policy
   * @param {string} policyId
   * @param {import('../core/WorldState.js').WorldState} worldState
   * @param {Object} [options]
   */
  enactPolicy(policyId, worldState, options = {}) {
    return this.policyEngine.enactPolicy(policyId, worldState, options);
  }

  /**
   * Legislative Action: Repeal a policy
   * @param {string} policyId
   * @param {import('../core/WorldState.js').WorldState} worldState
   * @param {Object} [options]
   */
  repealPolicy(policyId, worldState, options = {}) {
    return this.policyEngine.repealPolicy(policyId, worldState, options);
  }

  /**
   * Executive Action: Adjust statutory taxation rate
   * @param {number} rate - Between 0.05 and 0.45
   * @param {import('../core/WorldState.js').WorldState} worldState
   * @param {Object} [options]
   */
  setTaxRate(rate, worldState, options = {}) {
    const clampedRate = Math.max(0.05, Math.min(0.45, Number(rate)));
    worldState.economy.taxRate = clampedRate;
    if (worldState.metrics) worldState.metrics.taxRate = clampedRate;

    const tick = options.tick ?? worldState.tick ?? 0;
    if (typeof worldState.addEvent === 'function') {
      worldState.addEvent({
        id: `evt_tax_adjust_${Date.now()}`,
        title: `Statutory Tax Rate Adjusted to ${(clampedRate * 100).toFixed(0)}%`,
        type: 'POLICY_TAX_ADJUST',
        category: 'governance',
        severity: 1,
        startedAtTick: tick,
        totalDuration: 1,
        remainingTicks: 1,
        description: `Council adjusted municipal tax rate to ${(clampedRate * 100).toFixed(0)}%.`,
      });
    }

    return clampedRate;
  }

  /**
   * Get full telemetry snapshot for frontend Government Dashboard
   * @param {import('../core/WorldState.js').WorldState} worldState
   */
  getGovernmentSnapshot(worldState) {
    const econ = worldState.economy || {};
    const pop = worldState.population || {};

    return {
      approvalRating: this.civicApprovalScore,
      approvalTrend: this.approvalTrend,
      budget: {
        treasury: econ.treasury || 50000,
        taxRate: econ.taxRate || 0.15,
        totalExpensesPerTick: (worldState.metrics?.government?.totalExpensesPerTick ?? 230),
        policyExpenses: (worldState.metrics?.government?.policyExpenses ?? 75),
        serviceExpenses: (worldState.metrics?.government?.serviceExpenses ?? 155),
      },
      publicServices: this.publicServiceEngine.getPublicServicesSummary(),
      activePolicies: this.policyEngine.getActivePolicies(),
      policyDefinitions: this.policyEngine.getAllDefinitions(),
      policyHistory: this.policyEngine.policyHistory,
      populationMetrics: {
        total: pop.total || 1000,
        happiness: pop.happiness || 80,
        health: pop.health || 85,
        stability: worldState.metrics?.stability || 80,
      },
    };
  }
}

export default GovernmentEngine;
