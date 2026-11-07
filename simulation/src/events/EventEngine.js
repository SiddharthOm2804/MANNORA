import { EventEmitter } from 'events';
import { EventQueue } from './EventQueue.js';
import { EVENT_TYPES, EVENT_DEFINITIONS, EVENT_SEVERITY } from './EventTypes.js';

/**
 * EventEngine is the orchestrator for simulation events in NEURAL CITY.
 *
 * Implements:
 * - Deterministic event scheduling & injection
 * - Deep systemic propagation across:
 *   1. Resources (production, consumption, inventory shocks)
 *   2. Economy (prices, inflation, GDP, corporate output)
 *   3. Agents (homeostatic drives, health, wealth, anxiety, decision biases)
 *   4. Government (treasury, civic approval, public services load)
 *   5. World State & Spatial entities (building damage, infrastructure integrity, population)
 *   6. Analytics & Telemetry KPIs (stability, sustainability, health, happiness)
 * - Duration lifecycle & recovery behaviors (gradual restoration, reconstruction, stabilization, etc.)
 */
export class EventEngine extends EventEmitter {
  /**
   * @param {Object} [config]
   * @param {number} [config.eventProbability=0.03] - Chance of random stochastic event per tick
   * @param {number} [config.maxActiveEvents=5] - Maximum concurrent active events
   */
  constructor(config = {}) {
    super();

    this.eventProbability = Number(config.eventProbability ?? 0.03);
    this.maxActiveEvents = Number(config.maxActiveEvents ?? 5);

    this.eventQueue = new EventQueue({
      maxHistory: config.maxHistory || 200,
    });

    /** @type {Map<string, Object>} Catalog of available event definitions */
    this.catalog = new Map(Object.entries(EVENT_DEFINITIONS));
  }

  /**
   * Build a standardized Event object from definition or custom options.
   * Every event has: ID, timestamp, severity, affected entities, cause, effects, duration, recovery behavior.
   *
   * @param {Object} options
   * @param {string} options.type
   * @param {string} [options.id]
   * @param {number} [options.severity]
   * @param {Array<string>} [options.affectedEntities]
   * @param {string} [options.cause]
   * @param {Object} [options.effects]
   * @param {number} [options.duration]
   * @param {string} [options.recoveryBehavior]
   * @param {number} [options.triggerTick=0]
   * @param {string} [options.source='USER_INJECTION']
   * @returns {Object} Complete Event Object
   */
  createEvent(options = {}) {
    const type = options.type || EVENT_TYPES.RESOURCE_SHORTAGE;
    const def = this.catalog.get(type) || {};

    const severity = Number(options.severity ?? def.defaultSeverity ?? EVENT_SEVERITY.HIGH);
    const duration = Math.max(1, Number(options.duration ?? def.defaultDuration ?? 10));
    const timestamp = options.timestamp || new Date().toISOString();
    const id = options.id || `evt_${type}_${Date.now()}_${Math.floor(Math.random() * 9000 + 1000)}`;

    const cause = options.cause || def.defaultCause || 'Exogenous system disturbance';
    const recoveryBehavior = options.recoveryBehavior || def.recoveryBehavior || 'GRADUAL_RESTORATION';

    // Deep merge effects
    const baseEffects = def.effects ? JSON.parse(JSON.stringify(def.effects)) : {};
    const customEffects = options.effects ? JSON.parse(JSON.stringify(options.effects)) : {};

    const effects = {
      ...baseEffects,
      ...customEffects,
      modifiers: {
        ...(baseEffects.modifiers || {}),
        ...(customEffects.modifiers || {}),
      },
      resourceDeltas: {
        ...(baseEffects.resourceDeltas || {}),
        ...(customEffects.resourceDeltas || {}),
      },
      agentImpact: {
        ...(baseEffects.agentImpact || {}),
        ...(customEffects.agentImpact || {}),
      },
      governmentImpact: {
        ...(baseEffects.governmentImpact || {}),
        ...(customEffects.governmentImpact || {}),
      },
      buildingDamage: {
        ...(baseEffects.buildingDamage || {}),
        ...(customEffects.buildingDamage || {}),
      },
    };

    // Scale effects by severity factor (Base severity = 3)
    const severityFactor = severity / 3.0;
    if (severityFactor !== 1.0) {
      if (effects.resourceDeltas) {
        for (const [k, v] of Object.entries(effects.resourceDeltas)) {
          effects.resourceDeltas[k] = Math.round(v * severityFactor);
        }
      }
    }

    return {
      id,
      type,
      title: options.title || def.title || type,
      category: options.category || def.category || 'general',
      description: options.description || def.description || `Active event: ${type}`,
      timestamp,
      severity,
      priority: options.priority ?? severity,
      affectedEntities: Array.isArray(options.affectedEntities) ? [...options.affectedEntities] : [],
      cause,
      effects,
      duration,
      remainingTicks: duration,
      recoveryBehavior,
      source: options.source || 'USER_INJECTION',
      triggerTick: options.triggerTick ?? 0,
      startedAtTick: null,
      resolvedAtTick: null,
      status: 'INITIALIZED',
    };
  }

  /**
   * Inject an event into the simulation engine immediately or scheduled at a tick.
   *
   * @param {import('../core/WorldState.js').WorldState} worldState
   * @param {Object} eventOptions
   * @returns {Object} Created and registered event
   */
  injectEvent(worldState, eventOptions = {}) {
    const currentTick = worldState.tick || 0;
    const targetTick = eventOptions.triggerTick ?? currentTick;

    const event = this.createEvent({
      ...eventOptions,
      triggerTick: targetTick,
      source: eventOptions.source || 'USER_INJECTION',
    });

    if (targetTick <= currentTick) {
      // Execute immediately on active state
      this.activateEvent(worldState, event);
    } else {
      // Queue for deterministic future tick
      this.eventQueue.enqueue(event);
      if (Array.isArray(worldState.events?.scheduled)) {
        worldState.scheduleEvent(event);
      }
    }

    this.emit('event:injected', event);
    return event;
  }

  /**
   * Activate an event into the worldState and apply immediate one-time impacts.
   *
   * @param {import('../core/WorldState.js').WorldState} worldState
   * @param {Object} event
   */
  activateEvent(worldState, event) {
    event.startedAtTick = worldState.tick;
    event.status = 'ACTIVE';

    // Auto-resolve affected entities if not provided
    if (!event.affectedEntities || event.affectedEntities.length === 0) {
      event.affectedEntities = this._resolveDefaultAffectedEntities(worldState, event);
    }

    // 1. PROPAGATE TO WORLDSTATE ACTIVE LIST
    worldState.addActiveEvent(event);

    // 2. IMMEDIATE SYSTEMIC PROPAGATION: Resources
    this._propagateImmediateResourceImpacts(worldState, event);

    // 3. IMMEDIATE SYSTEMIC PROPAGATION: Buildings & Infrastructure
    this._propagateImmediateBuildingImpacts(worldState, event);

    // 4. IMMEDIATE SYSTEMIC PROPAGATION: Economy & Treasury
    this._propagateImmediateEconomicImpacts(worldState, event);

    // 5. IMMEDIATE SYSTEMIC PROPAGATION: Population & Agents
    this._propagateImmediateAgentImpacts(worldState, event);

    this.emit('event:activated', { tick: worldState.tick, event });
    return event;
  }

  /**
   * Default entity resolver based on event type.
   * @private
   */
  _resolveDefaultAffectedEntities(worldState, event) {
    const affected = [];
    const buildings = worldState.getBuildings();
    const agents = worldState.getAgents();

    if (event.type === EVENT_TYPES.INFRASTRUCTURE_FAILURE) {
      for (const b of buildings) {
        if (b.type === 'industrial' || b.type === 'commercial') {
          affected.push(b.id);
        }
      }
    } else if (event.type === EVENT_TYPES.ENERGY_SHORTAGE) {
      for (const b of buildings) {
        if (b.type === 'industrial' || b.production?.energy) {
          affected.push(b.id);
        }
      }
    } else if (event.type === EVENT_TYPES.WATER_SHORTAGE) {
      for (const b of buildings) {
        if (b.type === 'residential' || b.production?.water) {
          affected.push(b.id);
        }
      }
    } else if (event.type === EVENT_TYPES.DISEASE_OUTBREAK) {
      // Affect first sample of agents
      for (let i = 0; i < Math.min(10, agents.length); i++) {
        affected.push(agents[i].id);
      }
    }

    if (affected.length === 0) {
      affected.push('WORLD_MACRO_SYSTEM');
    }

    return affected;
  }

  /**
   * Immediate resource level shocks (e.g. water shortage drains reservoir).
   * @private
   */
  _propagateImmediateResourceImpacts(worldState, event) {
    const deltas = event.effects?.resourceDeltas;
    if (!deltas) return;

    for (const [resKey, deltaAmount] of Object.entries(deltas)) {
      if (worldState.resources[resKey]) {
        worldState.updateResource(resKey, deltaAmount, true);
      }
    }
  }

  /**
   * Building damage and efficiency reduction on targeted infrastructure.
   * @private
   */
  _propagateImmediateBuildingImpacts(worldState, event) {
    const bldDamage = event.effects?.buildingDamage;
    if (!bldDamage) return;

    const healthDmg = bldDamage.healthDamage || 0;
    const effCut = bldDamage.efficiencyReduction || 0;

    for (const b of worldState.getBuildings()) {
      const isTargeted = event.affectedEntities.includes(b.id) || event.affectedEntities.includes('WORLD_MACRO_SYSTEM');
      if (isTargeted) {
        if (healthDmg > 0) {
          b.health = Math.max(10, (b.health || 100) - healthDmg);
        }
        if (effCut > 0) {
          b.efficiency = Math.max(0.1, Number(((b.efficiency || 1.0) * (1.0 - effCut)).toFixed(2)));
        }
        worldState.updateBuilding(b.id, b);
      }
    }
  }

  /**
   * Economic liquidity contraction and market shocks.
   * @private
   */
  _propagateImmediateEconomicImpacts(worldState, event) {
    const effects = event.effects || {};
    const econ = worldState.economy;

    // Treasury deduction or contraction
    if (effects.treasuryImpactMultiplier && econ.treasury) {
      econ.treasury = Math.max(0, Math.round(econ.treasury * effects.treasuryImpactMultiplier));
    }

    // Direct price volatility spike
    if (effects.priceVolatility && econ.marketPrices) {
      for (const [key, mult] of Object.entries(effects.priceVolatility)) {
        const cleanKey = key.replace('Multiplier', '');
        if (econ.marketPrices[cleanKey]) {
          econ.marketPrices[cleanKey] = Number((econ.marketPrices[cleanKey] * mult).toFixed(3));
        }
      }
    }
  }

  /**
   * Agent and demographic immediate shocks (e.g. casualties, wealth shock, emergency needs).
   * @private
   */
  _propagateImmediateAgentImpacts(worldState, event) {
    const effects = event.effects || {};
    const pop = worldState.population;

    // Direct population casualties
    if (effects.casualtyRate && pop.total) {
      const casualtyCount = Math.max(1, Math.round(pop.total * effects.casualtyRate));
      pop.total = Math.max(10, pop.total - casualtyCount);
      pop.deaths = (pop.deaths || 0) + casualtyCount;
    }

    // Direct population immigration wave
    if (effects.populationInfluxRate && pop.total) {
      const immigrantCount = Math.max(1, Math.round(pop.total * effects.populationInfluxRate));
      pop.total += immigrantCount;
      pop.immigrants = (pop.immigrants || 0) + immigrantCount;
    }

    // Direct agent wealth / happiness / health shocks
    const agentImpact = effects.agentImpact || {};
    for (const agent of worldState.getAgents()) {
      if (agentImpact.wealthLossRatio && agent.wealth) {
        agent.wealth = Math.max(0, Math.round(agent.wealth * (1.0 - agentImpact.wealthLossRatio)));
      }
      if (agentImpact.safetyDelta && agent.needs) {
        agent.needs.safety = Math.max(0, Math.min(100, (agent.needs.safety || 85) + agentImpact.safetyDelta));
      }
      if (agentImpact.healthDelta && agent.healthState) {
        agent.healthState.health = Math.max(10, Math.min(100, (agent.healthState.health || 100) + agentImpact.healthDelta));
      }
    }
  }

  /**
   * Pipeline step: updates event lifecycles, ticks active events, checks queue,
   * performs recovery behavior, and logs event outcomes.
   *
   * @param {import('../core/WorldState.js').WorldState} worldState
   * @param {number} delta
   * @param {import('../core/RandomEngine.js').RandomEngine} random
   * @param {Object} [clockInfo]
   */
  update(worldState, delta, random, clockInfo = {}) {
    const currentTick = worldState.tick;

    // 1. Process EventQueue for scheduled ready events
    const readyEvents = this.eventQueue.pollReady(currentTick);
    for (const readyEvent of readyEvents) {
      this.activateEvent(worldState, readyEvent);
    }

    // Also process worldState.events.scheduled for backward compatibility
    const scheduled = worldState.events?.scheduled || [];
    const remainingScheduled = [];
    for (const item of scheduled) {
      if (item.triggerTick <= currentTick) {
        const fullEvent = this.createEvent({
          ...item,
          triggerTick: currentTick,
        });
        this.activateEvent(worldState, fullEvent);
      } else {
        remainingScheduled.push(item);
      }
    }
    worldState.events.scheduled = remainingScheduled;

    // 2. Active Events Tick Progression & Systemic Continuous Propagation
    const activeEvents = worldState.events?.active || [];
    const retainedActive = [];

    for (const evt of activeEvents) {
      evt.remainingTicks -= 1;

      // Continuous per-tick propagation
      this._propagateTickEffects(worldState, evt);

      if (evt.remainingTicks > 0) {
        retainedActive.push(evt);
      } else {
        // Event Expired: trigger recovery behavior and archive to log
        this._resolveEventRecovery(worldState, evt);
        this.eventQueue.recordHistory({
          ...evt,
          status: 'RESOLVED',
          resolvedAtTick: currentTick,
        });
      }
    }

    worldState.events.active = retainedActive;

    // 3. Stochastic generation of random events if below concurrency cap
    if (retainedActive.length < this.maxActiveEvents && random && random.nextFloat() < this.eventProbability) {
      this._triggerRandomEvent(worldState, random);
    }
  }

  /**
   * Continuous per-tick propagation across systems while an event is active.
   * @private
   */
  _propagateTickEffects(worldState, event) {
    const effects = event.effects || {};

    // 1. AGENT PROPAGATION
    const agentImpact = effects.agentImpact;
    if (agentImpact) {
      for (const agent of worldState.getAgents()) {
        if (agent.needs) {
          if (agentImpact.hungerDecayMultiplier && agent.needs.hunger !== undefined) {
            agent.needs.hunger = Math.min(100, agent.needs.hunger + 0.8 * (agentImpact.hungerDecayMultiplier - 1.0));
          }
          if (agentImpact.restDecayMultiplier && agent.needs.rest !== undefined) {
            agent.needs.rest = Math.max(0, agent.needs.rest - 0.7 * (agentImpact.restDecayMultiplier - 1.0));
          }
        }
        if (agent.healthState) {
          if (agentImpact.healthDecayRate) {
            agent.healthState.health = Math.max(5, agent.healthState.health - agentImpact.healthDecayRate * 0.2);
          }
        }
      }
    }

    // 2. GOVERNMENT FISCAL DRAIN
    const govImpact = effects.governmentImpact;
    if (govImpact && govImpact.emergencyExpense) {
      const expensePerTick = govImpact.emergencyExpense / Math.max(1, event.duration || 10);
      worldState.economy.treasury = Math.max(0, Number((worldState.economy.treasury - expensePerTick).toFixed(2)));
    }
  }

  /**
   * Execute Recovery Behavior once an event expires.
   * @private
   */
  _resolveEventRecovery(worldState, event) {
    const recovery = event.recoveryBehavior || 'GRADUAL_RESTORATION';
    const currentTick = worldState.tick;

    switch (recovery) {
      case 'INFRASTRUCTURE_REPAIR':
      case 'CIVIC_RECONSTRUCTION': {
        // Restore damaged buildings gradually
        for (const b of worldState.getBuildings()) {
          if (event.affectedEntities.includes(b.id) || event.affectedEntities.includes('WORLD_MACRO_SYSTEM')) {
            b.health = Math.min(100, (b.health || 80) + 20);
            b.efficiency = Math.min(1.0, Number(((b.efficiency || 0.8) + 0.2).toFixed(2)));
            worldState.updateBuilding(b.id, b);
          }
        }
        break;
      }
      case 'PRICE_EQUILIBRIUM_RESTORE':
      case 'ECONOMIC_STABILIZATION': {
        // Ease market prices back towards base baseline
        const prices = worldState.economy.marketPrices;
        if (prices) {
          for (const key of Object.keys(prices)) {
            prices[key] = Number((prices[key] * 0.9).toFixed(3));
          }
        }
        break;
      }
      case 'AQUIFER_RECHARGE':
      case 'GRID_REBALANCING':
      case 'GRADUAL_RESTORATION':
      default: {
        // Natural stabilization
        break;
      }
    }

    // Log resolved event to WorldState event history
    worldState.logEvent({
      id: event.id,
      type: event.type,
      title: event.title,
      category: event.category,
      severity: event.severity,
      cause: event.cause,
      recoveryBehavior: recovery,
      outcome: 'RECOVERED_SUCCESSFULLY',
      startedAtTick: event.startedAtTick,
      resolvedAtTick: currentTick,
    });

    this.emit('event:resolved', { tick: currentTick, event, recovery });
  }

  /**
   * Deterministically choose and trigger a random event from catalog.
   * @private
   */
  _triggerRandomEvent(worldState, random) {
    const types = Array.from(this.catalog.keys());
    const chosenType = random.choice(types);
    if (!chosenType) return null;

    const event = this.createEvent({
      type: chosenType,
      source: 'SIMULATION_DETERMINISTIC',
      triggerTick: worldState.tick,
    });

    this.activateEvent(worldState, event);
    return event;
  }

  /**
   * Aggregate active event modifiers for downstream consumption by ResourceSystem,
   * EconomyEngine, AgentEngine, GovernmentEngine, PopulationSystem, and MetricsSystem.
   *
   * @param {import('../core/WorldState.js').WorldState} worldState
   * @returns {Object}
   */
  static getAggregateModifiers(worldState) {
    const active = worldState?.events?.active || [];
    const aggregated = {
      energyProductionMultiplier: 1.0,
      waterProductionMultiplier: 1.0,
      mineralsProductionMultiplier: 1.0,
      agricultureProductionMultiplier: 1.0,
      techProductionMultiplier: 1.0,
      rawMaterialsProductionMultiplier: 1.0,
      energyConsumptionMultiplier: 1.0,
      waterConsumptionMultiplier: 1.0,
      agricultureConsumptionMultiplier: 1.0,
      productivityMultiplier: 1.0,
      gdpMultiplier: 1.0,
      happinessDelta: 0,
      healthDelta: 0,
      stabilityDelta: 0,
      inflationDelta: 0,
      approvalDelta: 0,
    };

    for (const evt of active) {
      const mods = evt.effects?.modifiers || evt.modifiers;
      if (!mods) continue;

      for (const [key, val] of Object.entries(mods)) {
        if (key.endsWith('Multiplier')) {
          aggregated[key] = Number(((aggregated[key] ?? 1.0) * val).toFixed(4));
        } else if (key.endsWith('Delta')) {
          aggregated[key] = Number(((aggregated[key] ?? 0) + val).toFixed(4));
        }
      }

      // Check for direct government impact approvalDelta
      if (evt.effects?.governmentImpact?.approvalDelta) {
        aggregated.approvalDelta = Number((aggregated.approvalDelta + evt.effects.governmentImpact.approvalDelta).toFixed(2));
      }
    }

    return aggregated;
  }
}

export default EventEngine;

