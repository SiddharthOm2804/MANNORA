import { NeedsSystem } from './NeedsSystem.js';
import { GoalSystem } from './GoalSystem.js';
import { MemorySystem } from './MemorySystem.js';
import { DecisionEngine } from './DecisionEngine.js';

/**
 * Agent represents an autonomous citizen in NEURAL CITY.
 *
 * Encapsulates:
 * - Identity (unique ID, name, age)
 * - Socio-economic role (occupation, income, wealth, skills)
 * - Homeostatic state (NeedsSystem, HealthState)
 * - Cognition (GoalSystem, DecisionEngine, MemorySystem)
 * - Physical & Social presence (location, purposeful movement, relationships)
 * - Personality traits (rationality, ambition, risk tolerance, social affinity, etc.)
 */
export class Agent {
  /**
   * @param {Object} config
   * @param {string} config.id - Unique Citizen ID
   * @param {string} [config.name]
   * @param {number} [config.age=30]
   * @param {string} [config.occupation='citizen']
   * @param {number} [config.income=25]
   * @param {number} [config.wealth=100]
   * @param {Object} [config.skills]
   * @param {Object} [config.needs]
   * @param {Object} [config.goals]
   * @param {Object} [config.healthState]
   * @param {Object} [config.location]
   * @param {Map|Object} [config.relationships]
   * @param {Object} [config.memory]
   * @param {Object} [config.personalityTraits]
   * @param {Object} [config.inventory]
   * @param {string|null} [config.employerId=null]
   * @param {string|null} [config.residenceId=null]
   * @param {string|null} [config.businessId=null]
   */
  constructor(config = {}) {
    if (!config.id) {
      throw new Error('Agent must be instantiated with a unique id');
    }

    this.id = String(config.id);
    this.name = config.name || `Citizen ${this.id.slice(-4)}`;
    this.age = Number(config.age ?? 30);
    this.occupation = config.occupation || 'citizen';
    this.income = Number(config.income ?? 25);
    this.wealth = Number(config.wealth ?? 100);
    this.savings = Number(config.savings ?? 0);

    // Skills Matrix [0.0, 1.0]
    this.skills = {
      farming: 0.5,
      engineering: 0.5,
      commerce: 0.5,
      science: 0.5,
      administration: 0.5,
      craftsmanship: 0.5,
      ...(config.skills || {}),
    };

    // Subsystems
    this.needs = config.needs instanceof NeedsSystem
      ? config.needs
      : new NeedsSystem(config.needs || {});

    this.goals = config.goals instanceof GoalSystem
      ? config.goals
      : new GoalSystem(config.goals || {});

    this.memory = config.memory instanceof MemorySystem
      ? config.memory
      : new MemorySystem(config.memory || {});

    this.decisionEngine = new DecisionEngine();

    // Health State
    const hsInput = config.healthState || config.state || {};
    this.healthState = {
      health: hsInput.health ?? 100,
      energy: hsInput.energy ?? 100,
      happiness: hsInput.happiness ?? 100,
      stress: hsInput.stress ?? 10,
      isSick: Boolean(hsInput.isSick),
      status: hsInput.status || 'active',
      currentAction: hsInput.currentAction || 'IDLE',
    };

    // Location & Purposeful Navigation
    const locInput = config.location || config.coordinates || {};
    this.location = {
      x: locInput.x ?? 50,
      y: locInput.y ?? 50,
      sector: locInput.sector || 'Sector-01',
      buildingId: locInput.buildingId ?? null,
      destination: locInput.destination ? { ...locInput.destination } : null,
    };

    // Social Relationships Map <agentId, RelationshipRecord>
    this.relationships = new Map();
    if (config.relationships) {
      if (config.relationships instanceof Map) {
        config.relationships.forEach((val, key) => this.relationships.set(key, structuredClone(val)));
      } else if (typeof config.relationships === 'object') {
        Object.entries(config.relationships).forEach(([key, val]) => {
          this.relationships.set(key, structuredClone(val));
        });
      }
    }

    // Personality Traits [0.0, 1.0]
    const traitsInput = config.personalityTraits || config.traits || {};
    this.personalityTraits = {
      rationality: traitsInput.rationality ?? 0.6,
      ambition: traitsInput.ambition ?? 0.5,
      riskTolerance: traitsInput.riskTolerance ?? 0.5,
      socialAffinity: traitsInput.socialAffinity ?? 0.5,
      productivity: traitsInput.productivity ?? 0.7,
      frugality: traitsInput.frugality ?? 0.5,
      adaptability: traitsInput.adaptability ?? 0.5,
    };

    // Inventory & Affiliations
    this.inventory = {
      food: 2,
      goods: 0,
      ...(config.inventory || {}),
    };

    this.employerId = config.employerId || null;
    this.residenceId = config.residenceId || null;
    this.businessId = config.businessId || null;

    // Community Memberships
    this.communityIds = Array.isArray(config.communityIds)
      ? [...config.communityIds]
      : (config.communityIds ? [config.communityIds] : []);
  }

  // =========================================================================
  // CORE SIMULATION TICK CYCLE
  // Agent observes world
  // → evaluates needs
  // → evaluates goals
  // → selects action
  // → action changes world
  // → memory updated
  // =========================================================================

  /**
   * Complete lifecycle execution per simulation tick.
   *
   * @param {import('../core/WorldState.js').WorldState} worldState
   * @param {import('./AgentEngine.js').AgentEngine} agentEngine
   * @param {number} delta
   * @param {import('../core/RandomEngine.js').RandomEngine} random
   * @param {Object} clockInfo
   * @returns {{ action: Object, outcome: Object }}
   */
  step(worldState, agentEngine, delta, random, clockInfo = {}) {
    // 1. OBSERVE WORLD
    const observations = this.observe(worldState, agentEngine, clockInfo);

    // 2. EVALUATE NEEDS
    this.evaluateNeeds(delta, clockInfo, observations);

    // 3. EVALUATE GOALS
    this.evaluateGoals(observations, clockInfo);

    // 4. SELECT ACTION (Deterministic rule-based, no random wandering, no LLM)
    const selectedAction = this.selectAction(observations, random);

    // 5. ACTION CHANGES WORLD & AGENT
    const outcome = this.executeAction(selectedAction, worldState, agentEngine, random, clockInfo);

    // 6. MEMORY UPDATED
    this.updateMemory(selectedAction, observations, outcome, clockInfo);

    return { action: selectedAction, outcome };
  }

  /**
   * 1. OBSERVE WORLD
   * Gathers local environmental context, proximity to venues, and market rates.
   *
   * @param {import('../core/WorldState.js').WorldState} worldState
   * @param {import('./AgentEngine.js').AgentEngine} agentEngine
   * @param {Object} clockInfo
   * @returns {Object}
   */
  observe(worldState, agentEngine, clockInfo = {}) {
    const currentHour = clockInfo.hour ?? 12;
    const isNight = currentHour >= 22 || currentHour < 6;
    const isWorkHours = currentHour >= 8 && currentHour < 18;

    // Resolve residence coordinates
    let residenceCoordinates = null;
    if (this.residenceId) {
      const resBld = worldState.getBuilding(this.residenceId);
      if (resBld) residenceCoordinates = resBld.coordinates;
    }

    // Resolve workplace coordinates
    let workplaceCoordinates = null;
    if (this.employerId) {
      const workBld = worldState.getBuilding(this.employerId);
      if (workBld) workplaceCoordinates = workBld.coordinates;
    }

    // Find nearest market & commercial venue
    let nearestMarket = null;
    let nearestCommercial = null;
    let nearestResidential = null;
    let minDistMarket = Infinity;
    let minDistComm = Infinity;
    let minDistRes = Infinity;
    const hiringBuildings = [];

    const buildings = worldState.getBuildings();
    for (const b of buildings) {
      const dist = Math.hypot(b.coordinates.x - this.location.x, b.coordinates.y - this.location.y);

      if (b.type === 'commercial' || b.category === 'commercial') {
        if (dist < minDistMarket) {
          minDistMarket = dist;
          nearestMarket = b;
        }
        if (dist < minDistComm) {
          minDistComm = dist;
          nearestCommercial = b;
        }
      }

      if (b.type === 'residential' || b.category === 'residential') {
        if (dist < minDistRes) {
          minDistRes = dist;
          nearestResidential = b;
        }
      }

      // Check if building has worker capacity for hiring
      if (b.type !== 'residential' && (b.workers || 0) < (b.capacity || 50)) {
        hiringBuildings.push(b);
      }
    }

    // Query nearby agents within proximity radius (e.g. 15 units)
    const nearbyAgents = agentEngine
      ? agentEngine.getNearbyAgents(this.location.x, this.location.y, 15, this.id)
      : [];

    // Commercial lots available for new businesses
    const availableCommercialLots = worldState.availableCommercialLots || [
      { x: 50, y: 50 },
      { x: 60, y: 60 },
      { x: 70, y: 30 },
      { x: 30, y: 70 },
    ];

    return {
      currentHour,
      currentTick: clockInfo.tick ?? worldState.tick,
      isNight,
      isWorkHours,
      workplaceCoordinates,
      residenceCoordinates,
      nearestMarket,
      nearestCommercial,
      nearestResidential,
      hiringBuildings,
      availableCommercialLots,
      nearbyAgents,
      marketFoodPrice: worldState.economy?.marketPrices?.agriculture ? Math.round(worldState.economy.marketPrices.agriculture * 4) : 6,
      cityStability: worldState.metrics?.stability ?? 85,
    };
  }

  /**
   * 2. EVALUATE NEEDS
   * Runs homeostatic metabolism decay and aligns health state.
   */
  evaluateNeeds(delta = 1.0, clockInfo = {}, observations = {}) {
    const isSleeping = this.healthState.status === 'resting';
    this.needs.decay(delta, isSleeping, {
      hasHome: Boolean(this.residenceId),
      cityStability: observations.cityStability,
    });

    // Synchronize health state metrics with needs
    this.healthState.health = this.needs.health;
    this.healthState.energy = this.needs.rest;
    this.healthState.happiness = this.needs.getOverallWellbeing();

    // Check illness or severe stress conditions
    if (this.healthState.health < 30) {
      this.healthState.isSick = true;
      this.healthState.stress = Math.min(100, this.healthState.stress + 10);
    } else if (this.healthState.health > 70) {
      this.healthState.isSick = false;
      this.healthState.stress = Math.max(0, this.healthState.stress - 5);
    }
  }

  /**
   * 3. EVALUATE GOALS
   * Reevaluates goals given current observations.
   */
  evaluateGoals(observations, clockInfo = {}) {
    return this.goals.evaluate(this, observations, clockInfo);
  }

  /**
   * 4. SELECT ACTION
   * Evaluates candidate actions deterministically.
   */
  selectAction(observations, random = null) {
    return this.decisionEngine.selectAction(this, observations, random);
  }

  /**
   * 5. ACTION CHANGES WORLD & AGENT
   * Executes the chosen action, directly updating agent state and mutating the world.
   */
  executeAction(action, worldState, agentEngine, random = null, clockInfo = {}) {
    const outcome = { success: true, details: '' };
    this.healthState.currentAction = action.type.toUpperCase();

    switch (action.type) {
      // -----------------------------------------------------------------------
      // TRAVEL (Purposeful vector step, no random wandering)
      // -----------------------------------------------------------------------
      case DecisionEngine.ACTIONS.TRAVEL: {
        this.healthState.status = 'traveling';
        const target = action.target;
        const dx = target.x - this.location.x;
        const dy = target.y - this.location.y;
        const dist = Math.hypot(dx, dy);

        // Speed is proportional to energy/health [1.5, 4.0 units per tick]
        const speed = Math.max(1.5, (this.healthState.energy / 100) * 3.5);

        if (dist <= speed) {
          // Arrived at destination
          this.location.x = target.x;
          this.location.y = target.y;
          this.location.buildingId = target.buildingId || null;
          this.location.destination = null;
          outcome.details = `Arrived at destination: ${target.label || 'location'}`;
          
          // Advance goal progress if moving toward active goal target
          const activeGoal = this.goals.getActiveGoal();
          if (activeGoal && activeGoal.target?.buildingId === target.buildingId) {
            this.goals.advanceProgress(1);
          }
        } else {
          // Purposeful step along vector towards destination
          this.location.x += (dx / dist) * speed;
          this.location.y += (dy / dist) * speed;
          this.location.destination = { ...target };
          outcome.details = `En route to ${target.label || 'destination'} (remaining dist: ${dist.toFixed(1)})`;
        }

        // Slight energy expenditure for walking
        this.needs.rest = Math.max(0, this.needs.rest - 0.4);
        break;
      }

      // -----------------------------------------------------------------------
      // WORK
      // -----------------------------------------------------------------------
      case DecisionEngine.ACTIONS.WORK: {
        this.healthState.status = 'working';
        const productivity = this.personalityTraits.productivity;
        const earnedWage = Number((this.income * (0.8 + productivity * 0.4)).toFixed(2));
        
        // Income tax deduction into municipal treasury
        const taxRate = worldState.economy?.taxRate ?? 0.15;
        const taxPaid = Number((earnedWage * taxRate).toFixed(2));
        const netEarnings = Number((earnedWage - taxPaid).toFixed(2));

        this.wealth = Number((this.wealth + netEarnings).toFixed(2));
        worldState.economy.treasury = Number((worldState.economy.treasury + taxPaid).toFixed(2));

        // Work depletes rest and energy, satisfies fulfillment and skill
        this.needs.rest = Math.max(0, this.needs.rest - 2.8);
        this.needs.fulfillment = Math.min(100, this.needs.fulfillment + 1.5);
        this._improveRelevantSkill(this.occupation, 0.005);

        // Contribute to employer building efficiency and enter workplace
        if (this.employerId) {
          const bld = worldState.getBuilding(this.employerId);
          if (bld) {
            this.location.x = bld.coordinates.x;
            this.location.y = bld.coordinates.y;
            this.location.buildingId = bld.id;
            bld.workers = Math.min(bld.capacity, (bld.workers || 0) + 1);
          }
        }

        this.goals.advanceProgress(1, clockInfo);
        outcome.details = `Worked shift. Net earnings: +${netEarnings} credits (Tax: ${taxPaid})`;
        break;
      }

      // -----------------------------------------------------------------------
      // EAT
      // -----------------------------------------------------------------------
      case DecisionEngine.ACTIONS.EAT: {
        this.healthState.status = 'active';
        if (this.inventory.food > 0) {
          this.inventory.food -= 1;
        }

        this.needs.satisfy('hunger', 45);
        this.needs.satisfy('health', 2);
        this.healthState.happiness = Math.min(100, this.healthState.happiness + 5);

        this.goals.advanceProgress(1, clockInfo);
        outcome.details = `Consumed meal. Hunger reduced to ${this.needs.hunger.toFixed(0)}`;
        break;
      }

      // -----------------------------------------------------------------------
      // SLEEP
      // -----------------------------------------------------------------------
      case DecisionEngine.ACTIONS.SLEEP: {
        this.healthState.status = 'resting';
        if (this.residenceId) {
          const bld = worldState.getBuilding(this.residenceId);
          if (bld) {
            this.location.x = bld.coordinates.x;
            this.location.y = bld.coordinates.y;
            this.location.buildingId = bld.id;
          }
        }
        this.needs.satisfy('rest', 22);
        this.needs.satisfy('health', 3);
        this.healthState.energy = Math.min(100, this.healthState.energy + 20);

        if (this.needs.rest >= 90) {
          this.goals.advanceProgress(1, clockInfo);
        }
        outcome.details = `Rested. Rest recovered to ${this.needs.rest.toFixed(0)}`;
        break;
      }

      // -----------------------------------------------------------------------
      // SHOP
      // -----------------------------------------------------------------------
      case DecisionEngine.ACTIONS.SHOP: {
        this.healthState.status = 'shopping';
        const cost = action.payload?.cost || 10;
        const quantity = action.payload?.quantity || 1;

        if (this.wealth >= cost) {
          this.wealth = Number((this.wealth - cost).toFixed(2));
          this.inventory.food += quantity;

          // If market building has owner or city commerce, inject money
          worldState.economy.income = Number(((worldState.economy.income || 0) + cost * 0.1).toFixed(2));

          // If severe hunger, eat 1 immediately
          if (this.needs.hunger >= 55) {
            this.inventory.food -= 1;
            this.needs.satisfy('hunger', 40);
          }

          this.goals.advanceProgress(1);
          outcome.details = `Purchased ${quantity} food units for ${cost} credits`;
        } else {
          outcome.success = false;
          outcome.details = 'Insufficient funds to purchase supplies';
        }
        break;
      }

      // -----------------------------------------------------------------------
      // SEARCH JOB
      // -----------------------------------------------------------------------
      case DecisionEngine.ACTIONS.SEARCH_JOB: {
        this.healthState.status = 'active';
        const targetBuilding = action.target;

        if (targetBuilding) {
          this.employerId = targetBuilding.id;
          this.occupation = this._deriveOccupation(targetBuilding);
          this.income = Math.round(28 + (this.personalityTraits.productivity || 0.5) * 15);
          this.healthState.happiness = Math.min(100, this.healthState.happiness + 15);
          
          this.goals.completeCurrentGoal();
          outcome.details = `Hired as ${this.occupation} at ${targetBuilding.name || targetBuilding.id}`;
        } else {
          outcome.details = 'Explored job market, no vacancies matched';
        }
        break;
      }

      // -----------------------------------------------------------------------
      // START BUSINESS
      // -----------------------------------------------------------------------
      case DecisionEngine.ACTIONS.START_BUSINESS: {
        this.healthState.status = 'active';
        const capital = action.payload?.capital || 500;
        const tick = clockInfo.tick ?? 0;

        if (this.wealth >= capital) {
          this.wealth = Number((this.wealth - capital).toFixed(2));
          const businessId = `bld_biz_${this.id}_t${tick}`;
          
          const newBuilding = {
            id: businessId,
            type: 'commercial',
            name: `${this.name}'s Commercial Exchange`,
            level: 1,
            health: 100,
            efficiency: 1.0,
            capacity: 30,
            workers: 1,
            maintenanceCost: 12,
            coordinates: action.target?.coordinates || { ...this.location },
          };

          worldState.addBuilding(newBuilding);
          this.businessId = businessId;
          this.employerId = businessId;
          this.occupation = 'entrepreneur';
          this.income = 48;
          this.healthState.happiness = 100;
          this.needs.satisfy('fulfillment', 40);

          this.goals.completeCurrentGoal(clockInfo);
          outcome.details = `Founded new business: ${newBuilding.name}`;
        } else {
          outcome.success = false;
          outcome.details = 'Insufficient capital to found business';
        }
        break;
      }

      // -----------------------------------------------------------------------
      // INTERACT (Mutual relationship update & social bonding)
      // -----------------------------------------------------------------------
      case DecisionEngine.ACTIONS.INTERACT: {
        this.healthState.status = 'active';
        const partnerId = action.target?.agentId;
        const partner = agentEngine ? agentEngine.getAgent(partnerId) : null;
        const tick = clockInfo.tick ?? 0;

        if (partnerId) {
          const affinityDelta = this._calculateAffinityDelta(this, partner);
          this.updateRelationship(partnerId, affinityDelta, 4, tick);

          if (partner) {
            partner.updateRelationship(this.id, affinityDelta, 4, tick);
            partner.needs.satisfy('social', 30);
            partner.healthState.happiness = Math.min(100, partner.healthState.happiness + 4);
          }

          this.needs.satisfy('social', 35);
          this.healthState.happiness = Math.min(100, this.healthState.happiness + 4);
          this.goals.advanceProgress(1, clockInfo);

          outcome.details = `Interacted with citizen ${action.target.name || partnerId} (Affinity Δ: +${affinityDelta})`;
        } else {
          outcome.details = 'No companion available for dialogue';
        }
        break;
      }

      // -----------------------------------------------------------------------
      // SAVE MONEY
      // -----------------------------------------------------------------------
      case DecisionEngine.ACTIONS.SAVE_MONEY: {
        this.healthState.status = 'active';
        const amount = Math.min(this.wealth - 100, action.payload?.amount || 25);

        if (amount > 0) {
          this.wealth = Number((this.wealth - amount).toFixed(2));
          this.savings = Number((this.savings + amount).toFixed(2));
          this.needs.satisfy('safety', 15);
          this.goals.advanceProgress(1);
          outcome.details = `Allocated ${amount} credits to security savings (Total: ${this.savings})`;
        } else {
          outcome.details = 'Savings allocation deferred; maintaining liquid reserve';
        }
        break;
      }

      // -----------------------------------------------------------------------
      // SPEND MONEY (Recreation / Entertainment)
      // -----------------------------------------------------------------------
      case DecisionEngine.ACTIONS.SPEND_MONEY: {
        this.healthState.status = 'active';
        const amount = action.payload?.amount || 25;

        if (this.wealth >= amount) {
          this.wealth = Number((this.wealth - amount).toFixed(2));
          this.needs.satisfy('fulfillment', 25);
          this.healthState.happiness = Math.min(100, this.healthState.happiness + 8);
          
          // Economic injection
          worldState.economy.treasury = Number((worldState.economy.treasury + amount * 0.15).toFixed(2));
          
          this.goals.advanceProgress(1);
          outcome.details = `Spent ${amount} credits on cultural recreation. Fulfillment boosted`;
        } else {
          outcome.details = 'Discretionary spending skipped due to budget limits';
        }
        break;
      }

      // -----------------------------------------------------------------------
      // REST (Domestic equilibrium)
      // -----------------------------------------------------------------------
      case DecisionEngine.ACTIONS.REST:
      default: {
        this.healthState.status = 'active';
        this.needs.satisfy('rest', 6);
        this.needs.satisfy('fulfillment', 2);
        outcome.details = 'Relaxed at domicile';
        break;
      }
    }

    return outcome;
  }

  /**
   * 6. UPDATE MEMORY
   * Records experience and outcomes into MemorySystem.
   */
  updateMemory(action, observations, outcome, clockInfo = {}) {
    const tick = clockInfo.tick ?? 0;
    let type = 'action';
    let emotionalValence = 0.0;
    let importance = 0.35;

    if (action.type === DecisionEngine.ACTIONS.START_BUSINESS) {
      type = 'milestone';
      importance = 0.95;
      emotionalValence = 0.9;
    } else if (action.type === DecisionEngine.ACTIONS.SEARCH_JOB && outcome.success) {
      type = 'milestone';
      importance = 0.85;
      emotionalValence = 0.7;
    } else if (action.type === DecisionEngine.ACTIONS.INTERACT) {
      type = 'interaction';
      importance = 0.55;
      emotionalValence = 0.5;
    } else if (action.type === DecisionEngine.ACTIONS.SHOP || action.type === DecisionEngine.ACTIONS.SAVE_MONEY) {
      type = 'economic';
      importance = 0.45;
      emotionalValence = 0.2;
    } else if (this.needs.hunger >= 80) {
      type = 'trauma';
      importance = 0.90;
      emotionalValence = -0.8;
    }

    this.memory.record({
      tick,
      type,
      description: outcome.details || `${action.type.toUpperCase()} completed: ${action.reason}`,
      importance,
      emotionalValence,
      relatedAgentId: action.target?.agentId || null,
      location: { ...this.location },
      metadata: { action: action.type, outcome },
    });
  }

  // =========================================================================
  // RELATIONSHIPS & SOCIAL HELPERS
  // =========================================================================

  /**
   * Update or create relationship record with another citizen.
   * @param {string} targetAgentId
   * @param {number} [affinityDelta=5]
   * @param {number} [trustDelta=2]
   * @param {number} [tick=0]
   */
  updateRelationship(targetAgentId, affinityDelta = 5, trustDelta = 2, tick = 0) {
    if (!targetAgentId || targetAgentId === this.id) return;

    const existing = this.relationships.get(targetAgentId) || {
      affinity: 10,
      trust: 20,
      interactionsCount: 0,
      type: 'acquaintance',
      lastInteractionTick: 0,
    };

    const newAffinity = Math.max(-100, Math.min(100, existing.affinity + affinityDelta));
    const newTrust = Math.max(0, Math.min(100, existing.trust + trustDelta));
    const interactionsCount = (existing.interactionsCount || 0) + 1;

    let relType = existing.type || 'friendship';
    let role = existing.role || 'acquaintance';

    if (relType === 'friendship' || relType === 'acquaintance') {
      if (newAffinity >= 85) role = 'confidant';
      else if (newAffinity >= 50) role = 'friend';
      else if (newAffinity <= -40) role = 'rival';
      else role = 'acquaintance';
    }

    // Normalized strength computation [0.0, 1.0]
    const normAffinity = Math.max(0, Math.min(1, (newAffinity + 100) / 200));
    const normTrust = Math.max(0, Math.min(1, newTrust / 100));
    const normFam = Math.min(1, Math.log10(interactionsCount + 1) / 1.5);
    const familyBonus = relType === 'family' ? 0.25 : 0.0;
    const strength = Number(Math.max(0.0, Math.min(1.0, (normAffinity * 0.35) + (normTrust * 0.35) + (normFam * 0.3) + familyBonus)).toFixed(3));

    this.relationships.set(targetAgentId, {
      ...existing,
      affinity: newAffinity,
      trust: newTrust,
      interactionsCount,
      type: relType,
      role,
      strength,
      lastInteractionTick: tick,
    });
  }

  /**
   * Calculate compatibility between two agents based on personality traits.
   * @private
   */
  _calculateAffinityDelta(agentA, agentB) {
    if (!agentB) return 5;
    const tA = agentA.personalityTraits;
    const tB = agentB.personalityTraits || {};

    // Closer traits -> higher affinity
    const diff =
      Math.abs(tA.rationality - (tB.rationality ?? 0.5)) +
      Math.abs(tA.socialAffinity - (tB.socialAffinity ?? 0.5));
    
    return Math.max(2, Math.round(12 - diff * 8));
  }

  /**
   * Derive plausible occupation for building type.
   * @private
   */
  _deriveOccupation(building) {
    switch (building.type) {
      case 'vertical_farm':
        return 'farmer';
      case 'industrial':
        return 'technician';
      case 'power_plant':
        return 'engineer';
      case 'research_lab':
        return 'scientist';
      case 'commercial':
        return 'merchant';
      default:
        return 'administrator';
    }
  }

  /**
   * Incremental improvement of relevant skill on the job.
   * @private
   */
  _improveRelevantSkill(occupation, delta = 0.005) {
    let key = 'craftsmanship';
    if (occupation === 'farmer') key = 'farming';
    if (occupation === 'engineer' || occupation === 'technician') key = 'engineering';
    if (occupation === 'merchant' || occupation === 'entrepreneur') key = 'commerce';
    if (occupation === 'scientist') key = 'science';
    if (occupation === 'administrator') key = 'administration';

    this.skills[key] = Math.min(1.0, Number(((this.skills[key] || 0.5) + delta).toFixed(4)));
  }

  // =========================================================================
  // SERIALIZATION & PLAIN OBJECT CONVERSION
  // =========================================================================

  /**
   * Serialize into complete JSON-safe object.
   * @returns {Object}
   */
  toPlainObject() {
    const relationshipsObj = {};
    for (const [id, rel] of this.relationships.entries()) {
      relationshipsObj[id] = structuredClone(rel);
    }

    return {
      id: this.id,
      name: this.name,
      age: this.age,
      occupation: this.occupation,
      income: this.income,
      wealth: this.wealth,
      savings: this.savings,
      skills: { ...this.skills },
      needs: this.needs.serialize(),
      goals: this.goals.serialize(),
      healthState: { ...this.healthState },
      location: { ...this.location },
      relationships: relationshipsObj,
      memory: this.memory.serialize(),
      personalityTraits: { ...this.personalityTraits },
      inventory: { ...this.inventory },
      employerId: this.employerId,
      residenceId: this.residenceId,
      businessId: this.businessId,
      communityIds: [...this.communityIds],
      // Backward compatibility aliases
      role: this.occupation,
      coordinates: { x: this.location.x, y: this.location.y },
      state: {
        status: this.healthState.status,
        health: this.healthState.health,
        energy: this.healthState.energy,
        happiness: this.healthState.happiness,
        wealth: this.wealth,
        currentAction: this.healthState.currentAction,
      },
      traits: { ...this.personalityTraits },
    };
  }

  /**
   * Factory method to restore from plain object.
   * @param {Object} data
   * @returns {Agent}
   */
  static fromPlainObject(data = {}) {
    return new Agent({
      ...data,
      needs: NeedsSystem.deserialize(data.needs),
      goals: GoalSystem.deserialize(data.goals),
      memory: MemorySystem.deserialize(data.memory),
    });
  }
}

export default Agent;
