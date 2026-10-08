/**
 * BuildingSystem manages infrastructure wear and tear,
 * repairs, operational worker assignment, and health/efficiency updates.
 */
export class BuildingSystem {
  /**
   * Pipeline step: updates all city buildings.
   * @param {import('../core/WorldState.js').WorldState} worldState
   * @param {number} delta
   * @param {import('../core/RandomEngine.js').RandomEngine} random
   * @param {Object} [clockInfo]
   */
  update(worldState, delta, random, clockInfo = {}) {
    const buildings = worldState.getBuildings();
    if (buildings.length === 0) return;

    const isTreasuryHealthy = worldState.economy.treasury > 500;
    const workingPop = worldState.population.employed || 500;

    let totalCapacity = 0;
    for (const b of buildings) {
      totalCapacity += b.capacity || 50;
    }

    const workerFillRatio = totalCapacity > 0 ? Math.min(1.0, workingPop / totalCapacity) : 1.0;

    for (const b of buildings) {
      let health = b.health ?? 100;

      // 1. Wear and Tear / Decay
      health -= 0.05;

      // 2. Maintenance & Repairs
      if (isTreasuryHealthy) {
        health = Math.min(100, health + 0.1);
      } else {
        // Unfunded decay penalty
        health -= 0.15;
      }
      health = Math.max(10, Math.min(100, Number(health.toFixed(2))));

      // 3. Worker allocation & operational efficiency
      const workers = Math.round((b.capacity || 50) * workerFillRatio);
      const healthFactor = health / 100;
      const workerFactor = b.capacity > 0 ? workers / b.capacity : 1.0;
      const efficiency = Number((healthFactor * 0.7 + workerFactor * 0.3).toFixed(3));

      worldState.updateBuilding(b.id, {
        health,
        workers,
        efficiency,
      });
    }
  }

  /**
   * Helper to create a standard building descriptor
   * @param {string} id
   * @param {string} type
   * @param {Object} [overrides]
   */
  static createBuilding(id, type = 'residential', overrides = {}) {
    const blueprints = {
      residential: {
        name: 'Habitat Arcology',
        category: 'residential',
        level: 1,
        health: 100,
        efficiency: 1.0,
        capacity: 200,
        workers: 0,
        maintenanceCost: 8,
        production: {},
        consumption: { energy: 4, water: 3 },
      },
      commercial: {
        name: 'Neural Commerce Hub',
        category: 'commercial',
        level: 1,
        health: 100,
        efficiency: 1.0,
        capacity: 50,
        workers: 40,
        maintenanceCost: 15,
        production: {},
        consumption: { energy: 6, water: 2 },
      },
      industrial: {
        name: 'Automated Synthesis Plant',
        category: 'industrial',
        level: 1,
        health: 100,
        efficiency: 1.0,
        capacity: 80,
        workers: 60,
        maintenanceCost: 25,
        production: { rawMaterials: 15, minerals: 5 },
        consumption: { energy: 12, water: 5 },
      },
      power_plant: {
        name: 'Fusion Grid Station',
        category: 'utility',
        level: 1,
        health: 100,
        efficiency: 1.0,
        capacity: 30,
        workers: 25,
        maintenanceCost: 30,
        production: { energy: 50 },
        consumption: { water: 5 },
      },
      water_filter: {
        name: 'Aquifer Filtration Plant',
        category: 'utility',
        level: 1,
        health: 100,
        efficiency: 1.0,
        capacity: 25,
        workers: 20,
        maintenanceCost: 20,
        production: { water: 40 },
        consumption: { energy: 8 },
      },
      vertical_farm: {
        name: 'Hydroponic Spire',
        category: 'agriculture',
        level: 1,
        health: 100,
        efficiency: 1.0,
        capacity: 40,
        workers: 35,
        maintenanceCost: 18,
        production: { agriculture: 35 },
        consumption: { energy: 6, water: 8 },
      },
      research_lab: {
        name: 'Quantum AI Laboratory',
        category: 'research',
        level: 1,
        health: 100,
        efficiency: 1.0,
        capacity: 20,
        workers: 18,
        maintenanceCost: 35,
        production: { technology: 20 },
        consumption: { energy: 10 },
      },
    };

    const blueprint = blueprints[type] || blueprints.residential;
    return {
      id,
      type,
      ...blueprint,
      ...overrides,
      coordinates: overrides.coordinates || { x: 50, y: 50 },
    };
  }
}

export default BuildingSystem;
