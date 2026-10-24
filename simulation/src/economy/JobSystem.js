/**
 * JobSystem coordinates employment, salary benchmarks, hiring capacity,
 * labor supply & demand, and occupational mobility in NEURAL CITY.
 */
export class JobSystem {
  /**
   * @param {Object} [config]
   */
  constructor(config = {}) {
    // Base wage matrix per tick for occupations
    this.salaryBenchmarks = {
      scientist: 45,
      engineer: 38,
      administrator: 36,
      entrepreneur: 48,
      technician: 32,
      merchant: 30,
      farmer: 26,
      citizen: 24,
      unemployed: 0,
      ...(config.salaryBenchmarks || {}),
    };
  }

  /**
   * Match an unemployed or underemployed agent with an open position
   * at an active commercial, industrial, or utility building.
   *
   * @param {import('../agents/Agent.js').Agent} agent
   * @param {import('../core/WorldState.js').WorldState} worldState
   * @returns {{ buildingId: string, occupation: string, salary: number } | null}
   */
  matchJob(agent, worldState) {
    const buildings = worldState.getBuildings();
    let bestMatch = null;
    let highestScore = -Infinity;

    for (const b of buildings) {
      if (b.type === 'residential') continue;

      const capacity = b.capacity || 50;
      const currentWorkers = b.workers || 0;
      const vacancies = capacity - currentWorkers;
      if (vacancies <= 0) continue;

      // Determine occupation and required skill
      const occupation = this.deriveOccupationFromBuilding(b);
      const skillScore = agent.skills?.[this.mapOccupationToSkill(occupation)] || 0.5;
      const distance = Math.hypot(b.coordinates.x - agent.location.x, b.coordinates.y - agent.location.y);

      // Score: high skill affinity, lower distance
      const score = (skillScore * 50) - (distance * 0.4);
      if (score > highestScore) {
        highestScore = score;
        bestMatch = {
          buildingId: b.id,
          building: b,
          occupation,
          salary: this.calculateSalary(occupation, agent.skills, agent.personalityTraits),
        };
      }
    }

    return bestMatch;
  }

  /**
   * Derive plausible occupation role from building type/category.
   * @param {Object} building
   * @returns {string}
   */
  deriveOccupationFromBuilding(building) {
    switch (building.type || building.category) {
      case 'research_lab':
      case 'science':
        return 'scientist';
      case 'industrial':
      case 'manufacturing':
        return 'technician';
      case 'power_plant':
      case 'water_treatment':
        return 'engineer';
      case 'commercial':
      case 'market':
        return 'merchant';
      case 'agricultural':
      case 'farm':
        return 'farmer';
      case 'government':
      case 'civic':
        return 'administrator';
      default:
        return 'technician';
    }
  }

  /**
   * Map occupation to relevant skill category.
   * @param {string} occupation
   * @returns {string}
   */
  mapOccupationToSkill(occupation) {
    switch (occupation) {
      case 'scientist': return 'science';
      case 'engineer': return 'engineering';
      case 'technician': return 'craftsmanship';
      case 'merchant': return 'commerce';
      case 'farmer': return 'farming';
      case 'administrator': return 'administration';
      default: return 'craftsmanship';
    }
  }

  /**
   * Calculate tailored salary factoring in benchmarks, skills, and productivity.
   * @param {string} occupation
   * @param {Object} [skills={}]
   * @param {Object} [traits={}]
   * @returns {number}
   */
  calculateSalary(occupation, skills = {}, traits = {}) {
    const base = this.salaryBenchmarks[occupation] || 25;
    const skillName = this.mapOccupationToSkill(occupation);
    const skillMultiplier = 0.8 + ((skills[skillName] || 0.5) * 0.4);
    const productivityMultiplier = 0.9 + ((traits.productivity || 0.5) * 0.3);

    return Math.round(base * skillMultiplier * productivityMultiplier);
  }

  /**
   * Aggregate employment statistics across world state.
   * @param {import('../core/WorldState.js').WorldState} worldState
   * @param {Array<import('../agents/Agent.js').Agent>} [agents=[]]
   * @returns {{ totalJobs: number, occupiedJobs: number, vacancies: number, unemploymentRate: number }}
   */
  getJobMarketTelemetry(worldState, agents = []) {
    let totalCapacity = 0;
    let occupiedJobs = 0;

    for (const b of worldState.getBuildings()) {
      if (b.type !== 'residential') {
        const cap = b.capacity || 50;
        totalCapacity += cap;
        occupiedJobs += (b.workers || 0);
      }
    }

    const workingPopulation = worldState.population.demographics?.working || Math.round(worldState.population.total * 0.65);
    const employedCount = Math.min(workingPopulation, occupiedJobs);
    const unemployedCount = Math.max(0, workingPopulation - employedCount);
    const unemploymentRate = workingPopulation > 0 ? Number((unemployedCount / workingPopulation).toFixed(3)) : 0.05;

    return {
      totalJobs: totalCapacity,
      occupiedJobs: employedCount,
      vacancies: Math.max(0, totalCapacity - occupiedJobs),
      unemployedCount,
      unemploymentRate,
    };
  }
}

export default JobSystem;
