import { EconomyEngine } from './EconomyEngine.js';
import { MarketEngine } from './MarketEngine.js';
import { JobSystem } from './JobSystem.js';
import { FinanceSystem } from './FinanceSystem.js';

/**
 * EconomySystem serves as the pipeline subsystem adapter for NEURAL CITY SimulationEngine (Priority 30),
 * backed by the comprehensive Phase 6 EconomyEngine architecture.
 */
export class EconomySystem {
  /**
   * @param {Object} [config]
   */
  constructor(config = {}) {
    this.economyEngine = new EconomyEngine(config);
    this.marketEngine = this.economyEngine.marketEngine;
    this.jobSystem = this.economyEngine.jobSystem;
    this.financeSystem = this.economyEngine.financeSystem;
  }

  /**
   * Pipeline step: updates the simulation economy.
   * @param {import('../core/WorldState.js').WorldState} worldState
   * @param {number} delta
   * @param {import('../core/RandomEngine.js').RandomEngine} random
   * @param {Object} [clockInfo]
   */
  update(worldState, delta, random, clockInfo = {}) {
    this.economyEngine.update(worldState, delta, random, clockInfo);
  }

  /**
   * Get latest economic telemetry metrics.
   * @returns {Object|null}
   */
  getEconomicMetrics() {
    return this.economyEngine.getEconomicMetrics();
  }
}

export default EconomySystem;

