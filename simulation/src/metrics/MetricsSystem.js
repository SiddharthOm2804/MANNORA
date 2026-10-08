import { EventSystem } from '../events/EventSystem.js';

/**
 * MetricsSystem computes composite civilization health, happiness,
 * stability, sustainability, and quality of life KPIs.
 */
export class MetricsSystem {
  /**
   * Pipeline step: computes simulation-wide composite metrics.
   * @param {import('../core/WorldState.js').WorldState} worldState
   * @param {number} delta
   * @param {import('../core/RandomEngine.js').RandomEngine} random
   * @param {Object} [clockInfo]
   */
  update(worldState, delta, random, clockInfo = {}) {
    const pop = worldState.population;
    const res = worldState.resources;
    const econ = worldState.economy;
    const deficits = worldState.metrics.deficits || {};
    const modifiers = EventSystem.getAggregateModifiers(worldState);

    // 1. HEALTH CALCULATION (0 - 100)
    let computedHealth = pop.health;
    if (deficits.water) computedHealth -= 5;
    if (deficits.agriculture) computedHealth -= 4;
    if (res.water.current > 1000 && res.agriculture.current > 1000) {
      computedHealth += 0.5; // Natural recovery
    }
    computedHealth += modifiers.healthDelta || 0;
    computedHealth = Math.max(0, Math.min(100, Math.round(computedHealth)));

    // 2. HAPPINESS CALCULATION (0 - 100)
    let computedHappiness = pop.happiness;
    // Employment bonus/penalty
    const employmentSatisfaction = (1 - pop.unemploymentRate) * 30;
    // Tax burden penalty
    const taxPenalty = econ.taxRate * 40;
    // Utility security bonus
    const utilitySecurity = (deficits.energy ? -15 : 10) + (deficits.water ? -20 : 10);

    const targetHappiness = 40 + employmentSatisfaction - taxPenalty + utilitySecurity;
    computedHappiness = (computedHappiness * 0.85) + (targetHappiness * 0.15) + (modifiers.happinessDelta || 0);
    computedHappiness = Math.max(0, Math.min(100, Math.round(computedHappiness)));

    // 3. POLLUTION (0 - 100)
    let rawPollution = 15;
    for (const b of worldState.getBuildings()) {
      if (b.type === 'industrial') rawPollution += 3;
    }
    const techCleanFactor = (res.technology.current / 5000) * 10;
    const computedPollution = Math.max(0, Math.min(100, Math.round(rawPollution - techCleanFactor)));

    // 4. CRIME RATE (0 - 100)
    const povertyPressure = (pop.unemploymentRate * 40) + ((100 - computedHappiness) * 0.3);
    const computedCrimeRate = Math.max(0, Math.min(100, Math.round(povertyPressure * 0.5)));

    // 5. STABILITY INDEX (0 - 100)
    let computedStability = (computedHappiness * 0.45) + ((100 - computedCrimeRate) * 0.35);
    if (econ.treasury < 500) computedStability -= 15;
    if (deficits.energy || deficits.water) computedStability -= 20;
    computedStability += modifiers.stabilityDelta || 0;
    computedStability = Math.max(0, Math.min(100, Math.round(computedStability)));

    // 6. SUSTAINABILITY INDEX (0 - 100)
    const energySurplusRatio = res.energy.production > 0 ? Math.min(1.5, res.energy.production / Math.max(1, res.energy.consumption)) : 1.0;
    const waterSurplusRatio = res.water.production > 0 ? Math.min(1.5, res.water.production / Math.max(1, res.water.consumption)) : 1.0;
    const computedSustainability = Math.max(0, Math.min(100, Math.round(
      (energySurplusRatio * 30) + (waterSurplusRatio * 30) + ((100 - computedPollution) * 0.4)
    )));

    // 7. QUALITY OF LIFE (0 - 100)
    const computedQualityOfLife = Math.max(0, Math.min(100, Math.round(
      (computedHealth * 0.35) + (computedHappiness * 0.35) + ((pop.education || 75) * 0.15) + ((100 - computedCrimeRate) * 0.15)
    )));

    // 8. ECONOMIC INDEX (0 - 100)
    const treasurySolvency = Math.min(40, (econ.treasury / 25000) * 40);
    const employmentScore = (1 - pop.unemploymentRate) * 40;
    const computedEconomicIndex = Math.max(0, Math.min(100, Math.round(
      treasurySolvency + employmentScore + 20
    )));

    // Sync back to worldState
    worldState.population.health = computedHealth;
    worldState.population.happiness = computedHappiness;

    worldState.updateMetrics({
      health: computedHealth,
      happiness: computedHappiness,
      stability: computedStability,
      sustainabilityIndex: computedSustainability,
      qualityOfLife: computedQualityOfLife,
      economicIndex: computedEconomicIndex,
      crimeRate: computedCrimeRate,
      pollution: computedPollution,
      population: pop.total,
      treasury: econ.treasury,
    });
  }
}

export default MetricsSystem;
