import { Agent } from './Agent.js';

/**
 * AgentEngine is the central multi-agent coordinator for citizen populations in NEURAL CITY.
 *
 * Responsibilities:
 * - Deterministic execution of citizen lifecycles (observes → evaluates needs → evaluates goals
 *   → selects action → action changes world → memory updated).
 * - Spatial querying & proximity indexing for purposeful interactions.
 * - Population generation, demographic synchronization, and socio-economic aggregation.
 */
export class AgentEngine {
  /**
   * @param {Object} [config]
   */
  constructor(config = {}) {
    /** @type {Map<string, Agent>} */
    this.agents = new Map();
    this.isInitialized = false;
  }

  /**
   * Register or hydrate an Agent instance.
   * @param {Agent|Object} agent
   * @returns {Agent}
   */
  registerAgent(agent) {
    const instance = agent instanceof Agent ? agent : Agent.fromPlainObject(agent);
    this.agents.set(instance.id, instance);
    return instance;
  }

  /**
   * Get an agent by unique ID.
   * @param {string} id
   * @returns {Agent|null}
   */
  getAgent(id) {
    return this.agents.get(id) || null;
  }

  /**
   * Get all registered agents.
   * @returns {Agent[]}
   */
  getAllAgents() {
    return Array.from(this.agents.values());
  }

  /**
   * Remove an agent by ID.
   * @param {string} id
   * @returns {boolean}
   */
  removeAgent(id) {
    return this.agents.delete(id);
  }

  /**
   * Spatial query: retrieve agents within a Euclidean radius around (x, y).
   *
   * @param {number} x
   * @param {number} y
   * @param {number} [radius=15]
   * @param {string} [excludeId=null]
   * @returns {Agent[]}
   */
  getNearbyAgents(x, y, radius = 15, excludeId = null) {
    const results = [];
    const radiusSq = radius * radius;

    for (const agent of this.agents.values()) {
      if (excludeId && agent.id === excludeId) continue;
      const dx = agent.location.x - x;
      const dy = agent.location.y - y;
      if (dx * dx + dy * dy <= radiusSq) {
        results.push(agent);
      }
    }

    return results;
  }

  /**
   * Synchronize agents from WorldState into the in-memory engine.
   * Automatically hydrates any plain objects in WorldState into rich Agent instances.
   *
   * @param {import('../core/WorldState.js').WorldState} worldState
   */
  syncFromWorldState(worldState) {
    const rawAgents = worldState.getAgents();
    for (const raw of rawAgents) {
      if (!this.agents.has(raw.id)) {
        this.registerAgent(raw);
      }
    }
  }

  /**
   * Pipeline step: deterministically updates all active citizens.
   *
   * @param {import('../core/WorldState.js').WorldState} worldState
   * @param {number} delta
   * @param {import('../core/RandomEngine.js').RandomEngine} random
   * @param {Object} [clockInfo={}]
   */
  update(worldState, delta, random, clockInfo = {}) {
    // 1. Sync any new agents from worldState
    this.syncFromWorldState(worldState);

    if (this.agents.size === 0) {
      return;
    }

    // 2. Sort agents deterministically by ID to guarantee 100% reproducible execution
    const sortedAgents = Array.from(this.agents.values()).sort((a, b) =>
      a.id.localeCompare(b.id)
    );

    let totalHealth = 0;
    let totalHappiness = 0;
    let totalWealth = 0;
    let employedCount = 0;
    const actionCounts = {};

    // 3. Step each agent through the full 6-phase simulation cycle
    for (const agent of sortedAgents) {
      const { action } = agent.step(worldState, this, delta, random, clockInfo);

      // Track telemetry
      totalHealth += agent.healthState.health;
      totalHappiness += agent.healthState.happiness;
      totalWealth += agent.wealth;

      if (agent.occupation !== 'unemployed' && agent.employerId) {
        employedCount++;
      }

      actionCounts[action.type] = (actionCounts[action.type] || 0) + 1;

      // Update plain object representation in WorldState
      worldState.updateAgent(agent.id, agent.toPlainObject());
    }

    // 4. Synchronize demographic & socioeconomic metrics with WorldState
    const agentCount = sortedAgents.length;
    const avgHealth = Math.round(totalHealth / agentCount);
    const avgHappiness = Math.round(totalHappiness / agentCount);
    const avgWealth = Number((totalWealth / agentCount).toFixed(2));
    const unemploymentRate = Number(((agentCount - employedCount) / agentCount).toFixed(3));

    // Blend agent averages with world population indicators
    worldState.population.health = Math.round(
      worldState.population.health * 0.7 + avgHealth * 0.3
    );
    worldState.population.happiness = Math.round(
      worldState.population.happiness * 0.7 + avgHappiness * 0.3
    );
    worldState.population.employed = employedCount;
    worldState.population.unemployed = agentCount - employedCount;
    worldState.population.unemploymentRate = unemploymentRate;

    // Attach high-level agent analytics to WorldState metrics
    worldState.metrics.health = worldState.population.health;
    worldState.metrics.happiness = worldState.population.happiness;
    worldState.metrics.agentAnalytics = {
      agentCount,
      avgHealth,
      avgHappiness,
      avgWealth,
      employedCount,
      unemploymentRate,
      actionDistribution: actionCounts,
    };
  }

  /**
   * Helper to spawn a realistic, deterministic citizen with plausible attributes.
   *
   * @param {string} id
   * @param {Object} [overrides={}]
   * @param {import('../core/RandomEngine.js').RandomEngine} [random=null]
   * @returns {Agent}
   */
  static createCitizen(id, overrides = {}, random = null) {
    const occupations = [
      'citizen',
      'engineer',
      'technician',
      'scientist',
      'merchant',
      'farmer',
      'administrator',
    ];

    const firstNames = ['Aria', 'Kaelen', 'Evelyn', 'Tarek', 'Linnea', 'Dax', 'Lyra', 'Soren', 'Vera', 'Zane', 'Elena', 'Marcus'];
    const lastNames = ['Voss', 'Rask', 'Chen', 'Sol', 'Mercer', 'Nakamura', 'Novak', 'Sterling', 'Corvus', 'Thorne'];

    const firstName = random ? random.choice(firstNames) : firstNames[0];
    const lastName = random ? random.choice(lastNames) : lastNames[0];
    const defaultName = `${firstName} ${lastName}`;

    const age = overrides.age ?? (random ? random.nextInt(20, 68) : 32);
    const occupation = overrides.occupation || overrides.role || (random ? random.choice(occupations) : 'citizen');

    const baseWealth = overrides.wealth ?? (random ? random.nextInt(80, 650) : 150);
    const baseIncome = overrides.income ?? (random ? random.nextInt(20, 45) : 30);

    const x = overrides.location?.x ?? overrides.coordinates?.x ?? (random ? random.nextInt(15, 85) : 50);
    const y = overrides.location?.y ?? overrides.coordinates?.y ?? (random ? random.nextInt(15, 85) : 50);

    const skills = {
      farming: random ? Number(random.range(0.2, 0.9).toFixed(2)) : 0.5,
      engineering: random ? Number(random.range(0.2, 0.9).toFixed(2)) : 0.5,
      commerce: random ? Number(random.range(0.2, 0.9).toFixed(2)) : 0.5,
      science: random ? Number(random.range(0.2, 0.9).toFixed(2)) : 0.5,
      administration: random ? Number(random.range(0.2, 0.9).toFixed(2)) : 0.5,
      craftsmanship: random ? Number(random.range(0.2, 0.9).toFixed(2)) : 0.5,
      ...(overrides.skills || {}),
    };

    const personalityTraits = {
      rationality: random ? Number(random.range(0.3, 0.95).toFixed(2)) : 0.65,
      ambition: random ? Number(random.range(0.25, 0.95).toFixed(2)) : 0.60,
      riskTolerance: random ? Number(random.range(0.2, 0.85).toFixed(2)) : 0.45,
      socialAffinity: random ? Number(random.range(0.25, 0.9).toFixed(2)) : 0.55,
      productivity: random ? Number(random.range(0.4, 0.95).toFixed(2)) : 0.70,
      frugality: random ? Number(random.range(0.3, 0.85).toFixed(2)) : 0.50,
      adaptability: random ? Number(random.range(0.35, 0.9).toFixed(2)) : 0.60,
      ...(overrides.personalityTraits || overrides.traits || {}),
    };

    const needs = {
      hunger: random ? random.nextInt(5, 30) : 10,
      rest: random ? random.nextInt(75, 100) : 90,
      social: random ? random.nextInt(50, 85) : 70,
      safety: 85,
      fulfillment: random ? random.nextInt(50, 80) : 60,
      health: 100,
      ...(overrides.needs || {}),
    };

    return new Agent({
      id,
      name: overrides.name || defaultName,
      age,
      occupation,
      income: baseIncome,
      wealth: baseWealth,
      skills,
      needs,
      personalityTraits,
      location: { x, y, sector: overrides.sector || 'Sector-01' },
      employerId: overrides.employerId || null,
      residenceId: overrides.residenceId || null,
      ...overrides,
    });
  }

  /**
   * Populate a world with citizens and assign them to residences and workplaces.
   *
   * @param {import('../core/WorldState.js').WorldState} worldState
   * @param {number} [count=20]
   * @param {import('../core/RandomEngine.js').RandomEngine} [random=null]
   * @returns {Agent[]}
   */
  populateWorld(worldState, count = 20, random = null) {
    const buildings = worldState.getBuildings();
    const residences = buildings.filter((b) => b.type === 'residential' || b.category === 'residential');
    const workplaces = buildings.filter((b) => b.type !== 'residential' && b.category !== 'residential');

    const created = [];
    for (let i = 1; i <= count; i++) {
      const id = `agt_${String(i).padStart(3, '0')}`;
      const res = residences.length > 0 ? residences[i % residences.length] : null;
      const work = workplaces.length > 0 ? workplaces[i % workplaces.length] : null;

      const agent = AgentEngine.createCitizen(
        id,
        {
          residenceId: res ? res.id : null,
          employerId: work ? work.id : null,
          location: res ? { x: res.coordinates.x, y: res.coordinates.y } : undefined,
        },
        random
      );

      this.registerAgent(agent);
      worldState.addAgent(agent.toPlainObject());
      created.push(agent);
    }

    return created;
  }
}

export default AgentEngine;
