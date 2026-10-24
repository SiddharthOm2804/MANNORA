/**
 * MarketEngine manages supply, demand, dynamic commodity pricing,
 * and market equilibrium across civilization resources in NEURAL CITY.
 *
 * Implements deterministic price adjustments based on inventory ratios,
 * price elasticity, and transaction volume.
 */
export class MarketEngine {
  /**
   * @param {Object} [config]
   * @param {Object} [config.basePrices]
   * @param {Object} [config.elasticity]
   * @param {number} [config.minPrice=0.1]
   * @param {number} [config.maxPrice=50.0]
   */
  constructor(config = {}) {
    this.basePrices = {
      energy: 1.0,
      minerals: 2.5,
      water: 0.8,
      agriculture: 1.5,
      technology: 5.0,
      rawMaterials: 2.0,
      ...(config.basePrices || {}),
    };

    // Elasticity coefficients for each resource
    this.elasticity = {
      energy: 0.8,
      minerals: 1.2,
      water: 0.5, // inelastic necessity
      agriculture: 0.6, // essential food necessity
      technology: 1.5, // elastic luxury/advanced goods
      rawMaterials: 1.1,
      ...(config.elasticity || {}),
    };

    this.minPrice = config.minPrice || 0.1;
    this.maxPrice = config.maxPrice || 50.0;
  }

  /**
   * Evaluate supply and demand ratios and calculate updated market prices.
   *
   * When supply decreases / shortage occurs:
   * → supply decreases
   * → scarcity ratio rises
   * → market price increases proportionally to elasticity
   *
   * @param {import('../core/WorldState.js').WorldState} worldState
   * @param {Object} [modifiers={}]
   * @returns {Object} Updated marketPrices map
   */
  updatePrices(worldState, modifiers = {}) {
    const resources = worldState.resources;
    const currentPrices = { ...(worldState.economy?.marketPrices || this.basePrices) };
    const updatedPrices = {};

    const resourceKeys = ['energy', 'minerals', 'water', 'agriculture', 'technology', 'rawMaterials'];

    for (const key of resourceKeys) {
      const res = resources[key];
      const basePrice = this.basePrices[key] || 1.0;
      const currentPrice = currentPrices[key] || basePrice;
      const elasticity = this.elasticity[key] || 1.0;

      if (!res || !res.max) {
        updatedPrices[key] = currentPrice;
        continue;
      }

      // Supply-Demand Ratio based on current inventory vs capacity
      // and production vs consumption flow
      const inventoryRatio = res.max > 0 ? res.current / res.max : 0.5;
      const flowDemand = Math.max(0.1, res.consumption || 1.0);
      const flowSupply = Math.max(0.1, res.production || 1.0);
      const flowRatio = flowDemand / flowSupply; // > 1 means demand outstrips supply

      let pricePressure = 0.0;

      // 1. Inventory buffer pressure
      if (inventoryRatio < 0.20) {
        // Critical scarcity: sharp upward price pressure
        const scarcitySeverity = (0.20 - inventoryRatio) / 0.20; // 0.0 to 1.0
        pricePressure += scarcitySeverity * 0.12 * elasticity;
      } else if (inventoryRatio < 0.40) {
        // Mild scarcity
        pricePressure += 0.03 * elasticity;
      } else if (inventoryRatio > 0.85) {
        // Surplus glut: downward price pressure
        const surplusSeverity = (inventoryRatio - 0.85) / 0.15;
        pricePressure -= surplusSeverity * 0.06 * elasticity;
      } else if (inventoryRatio > 0.70) {
        // Mild surplus
        pricePressure -= 0.02 * elasticity;
      }

      // 2. Production/Consumption flow pressure
      if (flowRatio > 1.2) {
        pricePressure += 0.04 * elasticity;
      } else if (flowRatio < 0.8) {
        pricePressure -= 0.02 * elasticity;
      }

      // Apply price pressure with mean-reversion drift toward base price
      let newPrice = currentPrice * (1 + pricePressure);
      const meanReversionDrift = (basePrice - newPrice) * 0.02;
      newPrice += meanReversionDrift;

      // Bound price safely
      updatedPrices[key] = Number(Math.max(this.minPrice, Math.min(this.maxPrice, newPrice)).toFixed(3));
    }

    return updatedPrices;
  }

  /**
   * Calculate transaction cost for purchasing a given quantity of resources.
   * @param {string} resourceKey
   * @param {number} quantity
   * @param {Object} marketPrices
   * @returns {number}
   */
  calculateCost(resourceKey, quantity, marketPrices) {
    const unitPrice = marketPrices[resourceKey] || this.basePrices[resourceKey] || 1.0;
    return Number((unitPrice * Math.max(0, quantity)).toFixed(2));
  }
}

export default MarketEngine;
