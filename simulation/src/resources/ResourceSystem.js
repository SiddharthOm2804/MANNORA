import { EventSystem } from '../events/EventSystem.js';

/**
 * ResourceSystem calculates generation, consumption, storage limits,
 * and deficit states across all civilization resources.
 */
export class ResourceSystem {
  /**
   * Pipeline step: updates all resources in the simulation world.
   * @param {import('../core/WorldState.js').WorldState} worldState
   * @param {number} delta
   * @param {import('../core/RandomEngine.js').RandomEngine} random
   * @param {Object} [clockInfo]
   */
  update(worldState, delta, random, clockInfo = {}) {
    const pop = worldState.population;
    const buildings = worldState.getBuildings();
    const modifiers = EventSystem.getAggregateModifiers(worldState);

    // 1. BASE CIVILIZATION NATURAL REGENERATION / GENERATION
    const baseProduction = {
      energy: 25 * (modifiers.energyProductionMultiplier ?? 1.0),
      water: 20 * (modifiers.waterProductionMultiplier ?? 1.0),
      minerals: 10 * (modifiers.mineralsProductionMultiplier ?? 1.0),
      agriculture: 15 * (modifiers.agricultureProductionMultiplier ?? 1.0),
      technology: 5 * (modifiers.techProductionMultiplier ?? 1.0),
      rawMaterials: 8 * (modifiers.rawMaterialsProductionMultiplier ?? 1.0),
    };

    // 2. PRODUCTION & CONSUMPTION FROM BUILDINGS
    const buildingProduction = {
      energy: 0,
      water: 0,
      minerals: 0,
      agriculture: 0,
      technology: 0,
      rawMaterials: 0,
    };

    const buildingConsumption = {
      energy: 0,
      water: 0,
      minerals: 0,
      agriculture: 0,
      technology: 0,
      rawMaterials: 0,
    };

    for (const b of buildings) {
      const healthFactor = (b.health || 100) / 100;
      const eff = (b.efficiency || 1.0) * healthFactor;
      const level = b.level || 1;

      // Add building production
      if (b.production) {
        for (const [resKey, amount] of Object.entries(b.production)) {
          if (buildingProduction[resKey] !== undefined) {
            const modKey = `${resKey}ProductionMultiplier`;
            const mult = modifiers[modKey] || 1.0;
            buildingProduction[resKey] += amount * level * eff * mult;
          }
        }
      }

      // Add building consumption
      if (b.consumption) {
        for (const [resKey, amount] of Object.entries(b.consumption)) {
          if (buildingConsumption[resKey] !== undefined) {
            const modKey = `${resKey}ConsumptionMultiplier`;
            const mult = modifiers[modKey] || 1.0;
            buildingConsumption[resKey] += amount * level * mult;
          }
        }
      }
    }

    // 3. POPULATION CONSUMPTION
    const popCount = pop.total || 1000;
    const popConsumption = {
      energy: (popCount * 0.03) * (modifiers.energyConsumptionMultiplier ?? 1.0),
      water: (popCount * 0.025) * (modifiers.waterConsumptionMultiplier ?? 1.0),
      minerals: popCount * 0.005,
      agriculture: (popCount * 0.02) * (modifiers.agricultureConsumptionMultiplier ?? 1.0),
      technology: popCount * 0.002,
      rawMaterials: popCount * 0.005,
    };

    // 4. AGGREGATE AND MUTATE EACH RESOURCE
    const resourceKeys = ['energy', 'water', 'minerals', 'agriculture', 'technology', 'rawMaterials'];
    const deficits = { energy: false, water: false, agriculture: false };

    for (const key of resourceKeys) {
      const res = worldState.resources[key];
      if (!res) continue;

      const totalProd = Number((baseProduction[key] + buildingProduction[key]).toFixed(3));
      const totalCons = Number((popConsumption[key] + buildingConsumption[key]).toFixed(3));
      const net = Number((totalProd - totalCons).toFixed(3));

      const prevCurrent = res.current;
      const newCurrent = Math.max(0, Math.min(res.max, Number((prevCurrent + net).toFixed(3))));

      res.production = totalProd;
      res.consumption = totalCons;
      res.net = net;
      res.current = newCurrent;

      // Sync to worldState metrics
      worldState.metrics[key] = newCurrent;

      // Detect deficits
      if (newCurrent <= 0 && net < 0) {
        if (key === 'energy' || key === 'water' || key === 'agriculture') {
          deficits[key] = true;
        }
      }
    }

    worldState.metrics.deficits = deficits;
  }
}

export default ResourceSystem;
