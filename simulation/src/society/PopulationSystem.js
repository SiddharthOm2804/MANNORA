import { EventSystem } from '../events/EventSystem.js';

/**
 * PopulationSystem manages demographic changes:
 * births, mortality, immigration, emigration, education, and labor force distribution.
 */
export class PopulationSystem {
  /**
   * Pipeline step: updates world population dynamics.
   * @param {import('../core/WorldState.js').WorldState} worldState
   * @param {number} delta
   * @param {import('../core/RandomEngine.js').RandomEngine} random
   * @param {Object} [clockInfo]
   */
  update(worldState, delta, random, clockInfo = {}) {
    const pop = worldState.population;
    const deficits = worldState.metrics.deficits || {};
    const modifiers = EventSystem.getAggregateModifiers(worldState);

    // 1. Natural Births
    let birthRate = 0.0008; // base per tick
    if (pop.happiness > 70 && pop.health > 70) {
      birthRate += 0.0004;
    }
    if (deficits.agriculture || deficits.water) {
      birthRate = 0.0001;
    }
    const births = Math.max(0, Math.floor(pop.total * birthRate * (1 + random.range(-0.1, 0.1))));

    // 2. Mortality / Deaths
    let deathRate = 0.0005; // base per tick
    if (pop.health < 40) {
      deathRate += 0.0015;
    }
    if (deficits.agriculture) {
      deathRate += 0.003; // Famine mortality
    }
    if (deficits.water) {
      deathRate += 0.004; // Dehydration mortality
    }
    const deaths = Math.max(0, Math.floor(pop.total * deathRate * (1 + random.range(-0.1, 0.1))));

    // 3. Migration
    let immigrants = 0;
    let emigrants = 0;

    const overallAttractiveness = (pop.happiness * 0.5) + (pop.health * 0.3) + ((1 - pop.unemploymentRate) * 20);

    if (overallAttractiveness > 75) {
      immigrants = Math.max(0, Math.floor(pop.total * 0.001 * (overallAttractiveness / 80)));
    } else if (overallAttractiveness < 45 || deficits.water || deficits.agriculture) {
      emigrants = Math.max(0, Math.floor(pop.total * 0.002));
    }

    // 4. Update Net Population
    const netChange = births - deaths + immigrants - emigrants;
    const newTotal = Math.max(10, pop.total + netChange);

    // 5. Update Demographics & Employment
    const workingRatio = 0.65;
    const workingPop = Math.round(newTotal * workingRatio);
    const youthPop = Math.round(newTotal * 0.20);
    const elderlyPop = Math.max(0, newTotal - workingPop - youthPop);

    // Calculate total available jobs from buildings
    let availableJobs = 0;
    for (const b of worldState.getBuildings()) {
      availableJobs += b.capacity || 50;
    }
    availableJobs = Math.max(100, availableJobs);

    const employed = Math.min(workingPop, Math.round(availableJobs * 0.85));
    const unemployed = Math.max(0, workingPop - employed);
    const unemploymentRate = workingPop > 0 ? Number((unemployed / workingPop).toFixed(3)) : 0.05;

    // Commit to WorldState
    worldState.updatePopulation({
      total: newTotal,
      births,
      deaths,
      immigrants,
      emigrants,
      employed,
      unemployed,
      unemploymentRate,
      demographics: {
        youth: youthPop,
        working: workingPop,
        elderly: elderlyPop,
      },
    });
  }
}

export default PopulationSystem;
