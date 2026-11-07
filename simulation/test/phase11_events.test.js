import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  EventEngine,
  EventQueue,
  EVENT_TYPES,
  EVENT_SEVERITY,
  EVENT_DEFINITIONS,
  WorldState,
  SimulationEngine,
} from '../src/index.js';

describe('Phase 11: Event Engine & EventQueue Architecture', () => {
  test('EventQueue enforces deterministic ordering: triggerTick ASC, priority DESC, id ASC', () => {
    const queue = new EventQueue();

    queue.enqueue({
      id: 'evt_c',
      type: EVENT_TYPES.ENERGY_SHORTAGE,
      triggerTick: 10,
      priority: 2,
    });
    queue.enqueue({
      id: 'evt_a',
      type: EVENT_TYPES.RESOURCE_SHORTAGE,
      triggerTick: 5,
      priority: 1,
    });
    queue.enqueue({
      id: 'evt_b',
      type: EVENT_TYPES.INFRASTRUCTURE_FAILURE,
      triggerTick: 10,
      priority: 5, // higher priority on same tick
    });

    const readyAt5 = queue.pollReady(5);
    assert.equal(readyAt5.length, 1);
    assert.equal(readyAt5[0].id, 'evt_a');

    const readyAt10 = queue.pollReady(10);
    assert.equal(readyAt10.length, 2);
    assert.equal(readyAt10[0].id, 'evt_b'); // priority 5 before priority 2
    assert.equal(readyAt10[1].id, 'evt_c');
  });

  test('EventEngine instantiates all 9 required canonical event types with mandatory attributes', () => {
    const engine = new EventEngine();
    const requiredTypes = [
      EVENT_TYPES.RESOURCE_SHORTAGE,
      EVENT_TYPES.INFRASTRUCTURE_FAILURE,
      EVENT_TYPES.ECONOMIC_CRASH,
      EVENT_TYPES.NATURAL_DISASTER,
      EVENT_TYPES.DISEASE_OUTBREAK,
      EVENT_TYPES.TECHNOLOGY_BREAKTHROUGH,
      EVENT_TYPES.MARKET_SHOCK,
      EVENT_TYPES.MIGRATION_WAVE,
      EVENT_TYPES.ENERGY_SHORTAGE,
    ];

    for (const type of requiredTypes) {
      const evt = engine.createEvent({ type });
      assert.ok(evt.id, `Event ${type} must have an ID`);
      assert.ok(evt.timestamp, `Event ${type} must have a timestamp`);
      assert.ok(typeof evt.severity === 'number', `Event ${type} must have numeric severity`);
      assert.ok(Array.isArray(evt.affectedEntities), `Event ${type} must have affectedEntities array`);
      assert.ok(typeof evt.cause === 'string', `Event ${type} must have cause`);
      assert.ok(typeof evt.effects === 'object', `Event ${type} must have effects object`);
      assert.ok(typeof evt.duration === 'number', `Event ${type} must have numeric duration`);
      assert.ok(typeof evt.recoveryBehavior === 'string', `Event ${type} must have recoveryBehavior`);
    }
  });

  test('Water Shortage injection propagates: resources -> economy -> agents -> government -> world state -> analytics', () => {
    const worldState = new WorldState({
      tick: 10,
      resources: {
        water: { current: 5000, max: 10000, production: 50, consumption: 40, net: 10 },
        energy: { current: 6000, max: 10000, production: 60, consumption: 30, net: 30 },
      },
      economy: {
        treasury: 10000,
        taxRate: 0.15,
        marketPrices: { water: 1.0, energy: 1.0 },
      },
      population: {
        total: 1000,
        health: 90,
        happiness: 85,
      },
    });

    const engine = new EventEngine();
    const event = engine.injectEvent(worldState, {
      type: EVENT_TYPES.WATER_SHORTAGE,
      severity: EVENT_SEVERITY.CRITICAL,
      duration: 6,
      cause: 'Aquifer pump station meltdown',
    });

    // 1. Check Event registration
    assert.equal(worldState.getActiveEvents().length, 1);
    assert.equal(worldState.getActiveEvents()[0].type, EVENT_TYPES.WATER_SHORTAGE);

    // 2. Propagation to RESOURCES (direct reservoir shock)
    assert.ok(worldState.resources.water.current < 5000, 'Water reserves must be depleted by shortage shock');

    // 3. Propagation to ECONOMY (aggregate modifiers reduce water production and raise price pressure)
    const modifiers = EventEngine.getAggregateModifiers(worldState);
    assert.ok(modifiers.waterProductionMultiplier < 1.0, 'Water production multiplier must be throttled');

    // 4. Verification in full simulation step
    const sim = new SimulationEngine({ seed: 42 });
    sim.init({
      resources: worldState.resources,
      economy: worldState.economy,
      population: worldState.population,
    });

    const initialHealth = sim.stateManager.getCurrentState().population.health;
    const initialHappiness = sim.stateManager.getCurrentState().population.happiness;

    // Inject water shortage into running simulation
    sim.eventEngine.injectEvent(sim.stateManager.getCurrentState(), {
      type: EVENT_TYPES.WATER_SHORTAGE,
      duration: 5,
    });

    // Step simulation 3 ticks
    sim.step();
    sim.step();
    sim.step();

    const postState = sim.stateManager.getCurrentState();

    // 5. Propagation to AGENTS / POPULATION
    assert.ok(postState.population.happiness < initialHappiness, 'Population happiness must decline from water shortage');

    // 6. Propagation to GOVERNMENT (approval rating drops)
    assert.ok(postState.metrics.government, 'Government metrics must be calculated');
    assert.ok(postState.metrics.government.civicApprovalScore <= 78, 'Government civic approval must drop during critical crisis');

    // 7. Propagation to ANALYTICS (stability, quality of life KPIs)
    assert.ok(typeof postState.metrics.stability === 'number');
    assert.ok(typeof postState.metrics.qualityOfLife === 'number');
  });

  test('Infrastructure Failure damages buildings and activates INFRASTRUCTURE_REPAIR recovery on expiry', () => {
    const sim = new SimulationEngine({ seed: 777 });
    sim.init({
      buildings: {
        bld_ind_01: {
          id: 'bld_ind_01',
          name: 'Power Converter Substation Alpha',
          type: 'industrial',
          health: 100,
          efficiency: 1.0,
          capacity: 50,
        },
      },
    });

    const state = sim.stateManager.getCurrentState();
    const buildings = state.getBuildings();
    assert.ok(buildings.length > 0, 'Simulation must have initialized buildings');

    const firstBuildingId = buildings[0].id;
    const initialBuildingHealth = buildings[0].health || 100;

    // Inject Infrastructure failure with duration 2
    sim.eventEngine.injectEvent(state, {
      type: EVENT_TYPES.INFRASTRUCTURE_FAILURE,
      duration: 2,
      affectedEntities: [firstBuildingId],
    });

    // Verify immediate damage to building
    const damagedBuilding = state.getBuilding(firstBuildingId);
    assert.ok(damagedBuilding.health < initialBuildingHealth, 'Building health must be damaged');

    // Step 2 ticks to expire event and trigger recovery
    sim.step();
    sim.step();

    const postState = sim.stateManager.getCurrentState();
    // Verify event moved from active to event log
    const activeEvts = postState.getActiveEvents();
    assert.equal(activeEvts.some(e => e.type === EVENT_TYPES.INFRASTRUCTURE_FAILURE), false);

    const log = postState.getEventLog();
    const resolved = log.find(e => e.type === EVENT_TYPES.INFRASTRUCTURE_FAILURE);
    assert.ok(resolved, 'Infrastructure failure must be recorded in event log with outcome');
    assert.equal(resolved.outcome, 'RECOVERED_SUCCESSFULLY');
  });
});
