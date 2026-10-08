/**
 * WorldState encapsulates the complete state of the civilization simulation at a specific tick.
 * Manages population, resources, economy, buildings, agents, events, and computed metrics.
 * Provides deep cloning, serialization, and deterministic state tracking.
 */
export class WorldState {
  /**
   * @param {Object} [data]
   * @param {number} [data.tick=0]
   * @param {{ width: number, height: number }} [data.dimensions]
   * @param {Object} [data.population]
   * @param {Object} [data.resources]
   * @param {Object} [data.economy]
   * @param {Map<string, Object>|Object} [data.buildings]
   * @param {Map<string, Object>|Object} [data.agents]
   * @param {Object} [data.events]
   * @param {Object} [data.metrics]
   * @param {Map<string, Object>|Object} [data.entities]
   * @param {Object} [data.metadata]
   */
  constructor(data = {}) {
    this.tick = data.tick || 0;
    this.dimensions = data.dimensions ? { ...data.dimensions } : { width: 100, height: 100 };

    this.metadata = {
      name: 'Neural City Alpha',
      seed: 123456789,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(data.metadata || {}),
    };

    // 1. POPULATION
    const popInput = data.population || {};
    const initialPopCount = popInput.total ?? (data.metrics?.population ?? 1000);
    this.population = {
      total: initialPopCount,
      employed: popInput.employed ?? Math.round(initialPopCount * 0.7),
      unemployed: popInput.unemployed ?? Math.max(0, initialPopCount - Math.round(initialPopCount * 0.7)),
      growthRate: popInput.growthRate ?? 0.001,
      births: popInput.births ?? 0,
      deaths: popInput.deaths ?? 0,
      immigrants: popInput.immigrants ?? 0,
      emigrants: popInput.emigrants ?? 0,
      demographics: {
        youth: popInput.demographics?.youth ?? Math.round(initialPopCount * 0.2),
        working: popInput.demographics?.working ?? Math.round(initialPopCount * 0.65),
        elderly: popInput.demographics?.elderly ?? Math.round(initialPopCount * 0.15),
      },
      education: popInput.education ?? 75,
      health: popInput.health ?? (data.metrics?.health ?? 100),
      happiness: popInput.happiness ?? (data.metrics?.happiness ?? 100),
      unemploymentRate: popInput.unemploymentRate ?? 0.05,
    };

    // 2. RESOURCES
    const resInput = data.resources || {};
    const defaultResource = (curr, max = 10000) => ({
      current: curr,
      max,
      production: 0,
      consumption: 0,
      net: 0,
    });

    this.resources = {
      energy: {
        ...defaultResource(resInput.energy?.current ?? (data.metrics?.energy ?? 5000), resInput.energy?.max ?? 20000),
        ...(resInput.energy || {}),
      },
      minerals: {
        ...defaultResource(resInput.minerals?.current ?? (data.metrics?.minerals ?? 2500), resInput.minerals?.max ?? 15000),
        ...(resInput.minerals || {}),
      },
      water: {
        ...defaultResource(resInput.water?.current ?? (data.metrics?.water ?? 5000), resInput.water?.max ?? 20000),
        ...(resInput.water || {}),
      },
      agriculture: {
        ...defaultResource(resInput.agriculture?.current ?? (data.metrics?.agriculture ?? 3000), resInput.agriculture?.max ?? 15000),
        ...(resInput.agriculture || {}),
      },
      technology: {
        ...defaultResource(resInput.technology?.current ?? (data.metrics?.technology ?? 1000), resInput.technology?.max ?? 10000),
        ...(resInput.technology || {}),
      },
      rawMaterials: {
        ...defaultResource(resInput.rawMaterials?.current ?? (data.metrics?.rawMaterials ?? 2000), resInput.rawMaterials?.max ?? 15000),
        ...(resInput.rawMaterials || {}),
      },
    };

    // 3. ECONOMY
    const econInput = data.economy || {};
    this.economy = {
      treasury: econInput.treasury ?? (data.metrics?.treasury ?? 50000),
      taxRate: econInput.taxRate ?? (data.metrics?.taxRate ?? 0.15),
      inflationRate: econInput.inflationRate ?? 0.02,
      gdp: econInput.gdp ?? 100000,
      income: econInput.income ?? 0,
      expenses: econInput.expenses ?? 0,
      netIncome: econInput.netIncome ?? 0,
      tradeBalance: econInput.tradeBalance ?? 0,
      marketPrices: {
        energy: econInput.marketPrices?.energy ?? 1.0,
        minerals: econInput.marketPrices?.minerals ?? 2.5,
        water: econInput.marketPrices?.water ?? 0.8,
        agriculture: econInput.marketPrices?.agriculture ?? 1.5,
        technology: econInput.marketPrices?.technology ?? 5.0,
        rawMaterials: econInput.marketPrices?.rawMaterials ?? 2.0,
      },
    };

    // 4. BUILDINGS (Map by ID)
    this.buildings = new Map();
    if (data.buildings) {
      if (data.buildings instanceof Map) {
        data.buildings.forEach((val, key) => this.buildings.set(key, structuredClone(val)));
      } else if (typeof data.buildings === 'object') {
        Object.entries(data.buildings).forEach(([key, val]) => {
          this.buildings.set(key, structuredClone(val));
        });
      }
    }

    // 5. AGENTS (Map by ID)
    this.agents = new Map();
    if (data.agents) {
      if (data.agents instanceof Map) {
        data.agents.forEach((val, key) => this.agents.set(key, structuredClone(val)));
      } else if (typeof data.agents === 'object') {
        Object.entries(data.agents).forEach(([key, val]) => {
          this.agents.set(key, structuredClone(val));
        });
      }
    }

    // 6. EVENTS
    const evtsInput = data.events || {};
    this.events = {
      active: Array.isArray(evtsInput.active) ? structuredClone(evtsInput.active) : [],
      log: Array.isArray(evtsInput.log) ? structuredClone(evtsInput.log) : [],
      scheduled: Array.isArray(evtsInput.scheduled) ? structuredClone(evtsInput.scheduled) : [],
    };

    // 7. ENTITIES (Map by ID for generic entities / cities / districts)
    this.entities = new Map();
    if (data.entities) {
      if (data.entities instanceof Map) {
        data.entities.forEach((val, key) => this.entities.set(key, structuredClone(val)));
      } else if (typeof data.entities === 'object') {
        Object.entries(data.entities).forEach(([key, val]) => {
          this.entities.set(key, structuredClone(val));
        });
      }
    }

    // 8. METRICS
    this.metrics = {
      population: this.population.total,
      energy: this.resources.energy.current,
      minerals: this.resources.minerals.current,
      water: this.resources.water.current,
      agriculture: this.resources.agriculture.current,
      technology: this.resources.technology.current,
      rawMaterials: this.resources.rawMaterials.current,
      treasury: this.economy.treasury,
      taxRate: this.economy.taxRate,
      stability: data.metrics?.stability ?? 85,
      happiness: this.population.happiness,
      health: this.population.health,
      sustainabilityIndex: data.metrics?.sustainabilityIndex ?? 80,
      qualityOfLife: data.metrics?.qualityOfLife ?? 85,
      crimeRate: data.metrics?.crimeRate ?? 5,
      pollution: data.metrics?.pollution ?? 10,
      economicIndex: data.metrics?.economicIndex ?? 75,
      deficits: {
        energy: false,
        water: false,
        agriculture: false,
        ...(data.metrics?.deficits || {}),
      },
      ...(data.metrics || {}),
    };
  }

  // ==================== BUILDINGS MANAGEMENT ====================

  /**
   * Add or replace a building
   * @param {Object} building
   */
  addBuilding(building) {
    if (!building || !building.id) {
      throw new Error('Building must have a valid id');
    }
    const fullBuilding = {
      type: 'residential',
      name: 'Residential Block',
      level: 1,
      health: 100,
      efficiency: 1.0,
      capacity: 100,
      workers: 0,
      maintenanceCost: 10,
      production: {},
      consumption: {},
      coordinates: { x: 0, y: 0 },
      ...building,
    };
    this.buildings.set(building.id, fullBuilding);
    this.metadata.updatedAt = new Date().toISOString();
    return fullBuilding;
  }

  /**
   * Get a building by ID
   * @param {string} id
   * @returns {Object|null}
   */
  getBuilding(id) {
    return this.buildings.get(id) || null;
  }

  /**
   * Update a building's properties
   * @param {string} id
   * @param {Object} updates
   */
  updateBuilding(id, updates) {
    const existing = this.buildings.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates, id };
    this.buildings.set(id, updated);
    this.metadata.updatedAt = new Date().toISOString();
    return updated;
  }

  /**
   * Remove a building by ID
   * @param {string} id
   * @returns {boolean}
   */
  removeBuilding(id) {
    const deleted = this.buildings.delete(id);
    if (deleted) this.metadata.updatedAt = new Date().toISOString();
    return deleted;
  }

  /**
   * Get all buildings as an array
   * @returns {Object[]}
   */
  getBuildings() {
    return Array.from(this.buildings.values());
  }

  /**
   * Get count of buildings
   * @returns {number}
   */
  getBuildingCount() {
    return this.buildings.size;
  }

  // ==================== AGENTS MANAGEMENT ====================

  /**
   * Add or replace an agent
   * @param {Object} agent
   */
  addAgent(agent) {
    if (!agent || !agent.id) {
      throw new Error('Agent must have a valid id');
    }
    const fullAgent = {
      name: 'Agent',
      role: 'citizen',
      coordinates: { x: 0, y: 0 },
      state: {
        status: 'active',
        health: 100,
        energy: 100,
        happiness: 100,
        wealth: 100,
      },
      needs: {
        hunger: 0,
        rest: 0,
        social: 50,
        safety: 100,
        fulfillment: 50,
      },
      traits: {
        rationality: 0.5,
        ambition: 0.5,
        productivity: 0.5,
        adaptability: 0.5,
        socialAffinity: 0.5,
      },
      inventory: {},
      employerId: null,
      residenceId: null,
      ...agent,
    };
    this.agents.set(agent.id, fullAgent);
    this.metadata.updatedAt = new Date().toISOString();
    return fullAgent;
  }

  /**
   * Get an agent by ID
   * @param {string} id
   * @returns {Object|null}
   */
  getAgent(id) {
    return this.agents.get(id) || null;
  }

  /**
   * Update an agent's properties
   * @param {string} id
   * @param {Object} updates
   */
  updateAgent(id, updates) {
    const existing = this.agents.get(id);
    if (!existing) return null;
    const updated = {
      ...existing,
      ...updates,
      id,
      state: { ...(existing.state || {}), ...(updates.state || {}) },
      needs: { ...(existing.needs || {}), ...(updates.needs || {}) },
      traits: { ...(existing.traits || {}), ...(updates.traits || {}) },
    };
    this.agents.set(id, updated);
    this.metadata.updatedAt = new Date().toISOString();
    return updated;
  }

  /**
   * Remove an agent by ID
   * @param {string} id
   * @returns {boolean}
   */
  removeAgent(id) {
    const deleted = this.agents.delete(id);
    if (deleted) this.metadata.updatedAt = new Date().toISOString();
    return deleted;
  }

  /**
   * Get all agents as an array
   * @returns {Object[]}
   */
  getAgents() {
    return Array.from(this.agents.values());
  }

  /**
   * Get count of active agents
   * @returns {number}
   */
  getAgentCount() {
    return this.agents.size;
  }

  // ==================== EVENTS MANAGEMENT ====================

  /**
   * Add an active simulation event
   * @param {Object} event
   */
  addActiveEvent(event) {
    if (!event || !event.id) throw new Error('Event must have an id');
    const fullEvent = {
      title: 'Simulation Event',
      category: 'general',
      severity: 1,
      totalDuration: 10,
      remainingTicks: 10,
      startedAtTick: this.tick,
      modifiers: {},
      ...event,
    };
    this.events.active.push(fullEvent);
    this.metadata.updatedAt = new Date().toISOString();
    return fullEvent;
  }

  /**
   * Remove an active event by ID
   * @param {string} id
   */
  removeActiveEvent(id) {
    const index = this.events.active.findIndex(e => e.id === id);
    if (index !== -1) {
      const removed = this.events.active.splice(index, 1)[0];
      this.metadata.updatedAt = new Date().toISOString();
      return removed;
    }
    return null;
  }

  /**
   * Get active events list
   * @returns {Object[]}
   */
  getActiveEvents() {
    return this.events.active;
  }

  /**
   * Log an event resolution to history
   * @param {Object} logEntry
   */
  logEvent(logEntry) {
    this.events.log.push({
      tick: this.tick,
      timestamp: new Date().toISOString(),
      ...logEntry,
    });
    // Keep last 100 event logs
    if (this.events.log.length > 100) {
      this.events.log.shift();
    }
    this.metadata.updatedAt = new Date().toISOString();
  }

  /**
   * Get event history log
   * @returns {Object[]}
   */
  getEventLog() {
    return this.events.log;
  }

  /**
   * Schedule a future event
   * @param {Object} scheduledEvent
   */
  scheduleEvent(scheduledEvent) {
    if (!scheduledEvent || typeof scheduledEvent.triggerTick !== 'number') {
      throw new Error('Scheduled event must specify a triggerTick');
    }
    this.events.scheduled.push(scheduledEvent);
    this.events.scheduled.sort((a, b) => a.triggerTick - b.triggerTick);
  }

  /**
   * Get scheduled future events
   * @returns {Object[]}
   */
  getScheduledEvents() {
    return this.events.scheduled;
  }

  // ==================== RESOURCES & ECONOMY ====================

  /**
   * Adjust or set resource amount
   * @param {string} type - Resource type (energy, minerals, water, agriculture, technology, rawMaterials)
   * @param {number} amount - Amount or delta
   * @param {boolean} [isDelta=true] - If true, adds to current; if false, sets current
   */
  updateResource(type, amount, isDelta = true) {
    if (!this.resources[type]) {
      this.resources[type] = { current: 0, max: 10000, production: 0, consumption: 0, net: 0 };
    }
    const res = this.resources[type];
    const newCurrent = isDelta ? res.current + amount : amount;
    res.current = Math.max(0, Math.min(res.max, Number(newCurrent.toFixed(4))));
    this.metrics[type] = res.current;
    this.metadata.updatedAt = new Date().toISOString();
  }

  /**
   * Update economy metrics and values
   * @param {Object} partialEconomy
   */
  updateEconomy(partialEconomy = {}) {
    this.economy = {
      ...this.economy,
      ...partialEconomy,
      marketPrices: {
        ...(this.economy.marketPrices || {}),
        ...(partialEconomy.marketPrices || {}),
      },
    };
    if (typeof partialEconomy.treasury === 'number') {
      this.metrics.treasury = this.economy.treasury;
    }
    if (typeof partialEconomy.taxRate === 'number') {
      this.metrics.taxRate = this.economy.taxRate;
    }
    this.metadata.updatedAt = new Date().toISOString();
  }

  /**
   * Update population values
   * @param {Object} partialPop
   */
  updatePopulation(partialPop = {}) {
    this.population = {
      ...this.population,
      ...partialPop,
      demographics: {
        ...(this.population.demographics || {}),
        ...(partialPop.demographics || {}),
      },
    };
    if (typeof partialPop.total === 'number') {
      this.metrics.population = this.population.total;
    }
    if (typeof partialPop.health === 'number') {
      this.metrics.health = this.population.health;
    }
    if (typeof partialPop.happiness === 'number') {
      this.metrics.happiness = this.population.happiness;
    }
    this.metadata.updatedAt = new Date().toISOString();
  }

  // ==================== GENERIC ENTITIES (CITIES, DISTRICTS) ====================

  /**
   * Get an entity by ID
   * @param {string} id
   * @returns {Object|null}
   */
  getEntity(id) {
    return this.entities.get(id) || null;
  }

  /**
   * Set or update an entity
   * @param {string} id
   * @param {Object} entityData
   */
  setEntity(id, entityData) {
    this.entities.set(id, { id, ...entityData });
    this.metadata.updatedAt = new Date().toISOString();
  }

  /**
   * Remove an entity by ID
   * @param {string} id
   * @returns {boolean}
   */
  removeEntity(id) {
    return this.entities.delete(id);
  }

  /**
   * Returns all entities as an array
   * @returns {Object[]}
   */
  getEntities() {
    return Array.from(this.entities.values());
  }

  /**
   * Returns count of active entities
   * @returns {number}
   */
  getEntityCount() {
    return this.entities.size;
  }

  // ==================== METRICS ====================

  /**
   * Update city / world metrics and keep deep fields synchronized
   * @param {Object} partialMetrics
   */
  updateMetrics(partialMetrics = {}) {
    this.metrics = {
      ...this.metrics,
      ...partialMetrics,
      deficits: {
        ...(this.metrics.deficits || {}),
        ...(partialMetrics.deficits || {}),
      },
    };

    // Synchronize deeply nested objects when top metrics are updated
    if (typeof partialMetrics.population === 'number') {
      this.population.total = partialMetrics.population;
    }
    if (typeof partialMetrics.treasury === 'number') {
      this.economy.treasury = partialMetrics.treasury;
    }
    if (typeof partialMetrics.taxRate === 'number') {
      this.economy.taxRate = partialMetrics.taxRate;
    }
    if (typeof partialMetrics.health === 'number') {
      this.population.health = partialMetrics.health;
    }
    if (typeof partialMetrics.happiness === 'number') {
      this.population.happiness = partialMetrics.happiness;
    }

    for (const resKey of ['energy', 'minerals', 'water', 'agriculture', 'technology', 'rawMaterials']) {
      if (typeof partialMetrics[resKey] === 'number' && this.resources[resKey]) {
        this.resources[resKey].current = partialMetrics[resKey];
      }
    }

    this.metadata.updatedAt = new Date().toISOString();
  }

  /**
   * Retrieve current metrics
   * @returns {Object}
   */
  getMetrics() {
    return { ...this.metrics };
  }

  // ==================== CLONE & SERIALIZATION ====================

  /**
   * Deep clone this WorldState for immutable stepping or snapshotting
   * @returns {WorldState}
   */
  clone() {
    return WorldState.deserialize(this.serialize());
  }

  /**
   * Serialize state into a plain JSON-safe object
   * @returns {Object}
   */
  serialize() {
    const buildingsObj = {};
    for (const [id, b] of this.buildings.entries()) {
      buildingsObj[id] = structuredClone(b);
    }

    const agentsObj = {};
    for (const [id, a] of this.agents.entries()) {
      agentsObj[id] = structuredClone(a);
    }

    const entitiesObj = {};
    for (const [id, entity] of this.entities.entries()) {
      entitiesObj[id] = structuredClone(entity);
    }

    return {
      tick: this.tick,
      dimensions: { ...this.dimensions },
      metadata: structuredClone(this.metadata),
      population: structuredClone(this.population),
      resources: structuredClone(this.resources),
      economy: structuredClone(this.economy),
      buildings: buildingsObj,
      agents: agentsObj,
      events: structuredClone(this.events),
      metrics: structuredClone(this.metrics),
      entities: entitiesObj,
    };
  }

  /**
   * Factory method to deserialize plain object back into WorldState instance
   * @param {Object} data
   * @returns {WorldState}
   */
  static deserialize(data) {
    if (!data) return new WorldState();
    return new WorldState(data);
  }
}

export default WorldState;
