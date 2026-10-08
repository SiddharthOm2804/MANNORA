import { EventSystem } from '../events/EventSystem.js';

/**
 * EconomySystem manages municipal taxation, treasury updates,
 * maintenance costs, GDP calculation, and dynamic market prices based on supply/demand.
 */
export class EconomySystem {
  /**
   * Pipeline step: updates the simulation economy.
   * @param {import('../core/WorldState.js').WorldState} worldState
   * @param {number} delta
   * @param {import('../core/RandomEngine.js').RandomEngine} random
   * @param {Object} [clockInfo]
   */
  update(worldState, delta, random, clockInfo = {}) {
    const pop = worldState.population;
    const econ = worldState.economy;
    const modifiers = EventSystem.getAggregateModifiers(worldState);

    // 1. Calculate Tax Revenues
    const baseWagePerTick = 25;
    const employedCount = pop.employed || Math.round(pop.total * 0.7);
    const totalWages = employedCount * baseWagePerTick;
    const taxIncome = totalWages * econ.taxRate;

    // Commercial / Industrial bonus revenue from buildings
    let commercialBonus = 0;
    const buildings = worldState.getBuildings();
    for (const b of buildings) {
      if (b.type === 'commercial' || b.type === 'industrial') {
        commercialBonus += (b.level || 1) * 15 * (b.efficiency || 1.0);
      }
    }
    const commercialTax = commercialBonus * econ.taxRate;
    const totalIncome = Number(((taxIncome + commercialTax) * modifiers.gdpMultiplier).toFixed(2));

    // 2. Calculate Maintenance Expenses
    let totalExpenses = 0;
    // Civic overhead based on population
    totalExpenses += pop.total * 0.05;

    // Infrastructure maintenance per building
    for (const b of buildings) {
      totalExpenses += (b.maintenanceCost || 10) * (b.level || 1);
    }
    totalExpenses = Number(totalExpenses.toFixed(2));

    // 3. Dynamic Market Prices Calculation
    const marketPrices = { ...econ.marketPrices };
    for (const [resKey, resObj] of Object.entries(worldState.resources)) {
      const fillRatio = resObj.max > 0 ? resObj.current / resObj.max : 0.5;
      let targetPrice = marketPrices[resKey] || 1.0;

      if (fillRatio < 0.2) {
        // High scarcity -> price surge
        targetPrice = targetPrice * 1.05;
      } else if (fillRatio > 0.8) {
        // Surplus -> price reduction
        targetPrice = targetPrice * 0.96;
      }

      // Clamp price within reasonable boundaries
      marketPrices[resKey] = Number(Math.max(0.2, Math.min(25.0, targetPrice)).toFixed(3));
    }

    // 4. Compute Gross Domestic Product (GDP)
    const techFactor = (worldState.resources.technology?.current || 1000) * 0.1;
    const baseGdp = 50000;
    const calculatedGdp = Number((
      (baseGdp + (employedCount * 60) + techFactor + commercialBonus * 10) *
      modifiers.gdpMultiplier
    ).toFixed(2));

    // 5. Update Inflation
    let inflationRate = econ.inflationRate + modifiers.inflationDelta;
    if (econ.treasury < 1000) {
      // Fiscal strain inflation
      inflationRate += 0.001;
    }
    inflationRate = Math.max(-0.05, Math.min(0.25, inflationRate));

    // 6. Net Treasury Mutation
    const netIncome = Number((totalIncome - totalExpenses).toFixed(2));
    const newTreasury = Math.max(0, Number((econ.treasury + netIncome).toFixed(2)));

    // Commit to WorldState
    worldState.updateEconomy({
      treasury: newTreasury,
      income: totalIncome,
      expenses: totalExpenses,
      netIncome,
      gdp: calculatedGdp,
      inflationRate: Number(inflationRate.toFixed(4)),
      marketPrices,
    });
  }
}

export default EconomySystem;
