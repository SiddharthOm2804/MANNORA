import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  SimulationEngine,
  WorldState,
  SimulationClock,
  StateManager,
  RandomEngine,
  BuildingSystem,
  AgentSystem,
  EventSystem,
  runHeadlessSimulation,
} from '../src/index.js';

describe('Phase 4: RandomEngine (Mulberry32 PRNG)', () => {
  test('generates deterministic pseudorandom numbers given a seed', () => {
    const rng1 = new RandomEngine(42);
    const rng2 = new RandomEngine(42);

    const stream1 = [rng1.nextFloat(), rng1.nextFloat(), rng1.nextInt(1, 100), rng1.range(5, 10)];
    const stream2 = [rng2.nextFloat(), rng2.nextFloat(), rng2.nextInt(1, 100), rng2.range(5, 10)];

    assert.deepEqual(stream1, stream2);
  });

  test('shuffle produces deterministic permutation', () => {
    const rng = new RandomEngine(99);
    const arr = [1, 2, 3, 4, 5];
    const shuffled = rng.shuffle(arr);

    assert.equal(shuffled.length, arr.length);
    assert.deepEqual(shuffled.slice().sort(), arr.slice().sort());
  });

  test('weightedChoice picks deterministically based on weights', () => {
    const rng1 = new RandomEngine(123);
    const rng2 = new RandomEngine(123);

    const items = ['common', 'rare', 'legendary'];
    const weights = [80, 19, 1];

    const pick1 = rng1.weightedChoice(items, weights);
    const pick2 = rng2.weightedChoice(items, weights);

    assert.equal(pick1, pick2);
  });

  test('fork creates an independent deterministic PRNG child', () => {
    const parent1 = new RandomEngine(500);
    const child1 = parent1.fork();

    const parent2 = new RandomEngine(500);
    const child2 = parent2.fork();

    assert.equal(child1.nextFloat(), child2.nextFloat());
  });
});

describe('Phase 4: SimulationClock', () => {
  test('tracks simulationDay and simulationHour progression', () => {
    const clock = new SimulationClock({ tickRate: 10, ticksPerHour: 1, hoursPerDay: 24 });
    assert.equal(clock.currentTick, 0);
    assert.equal(clock.simulationDay, 1);
    assert.equal(clock.simulationHour, 0);

    // Step 5 ticks = 5 hours
    for (let i = 0; i < 5; i++) {
      clock.tick();
    }
    assert.equal(clock.currentTick, 5);
    assert.equal(clock.simulationHour, 5);
    assert.equal(clock.simulationDay, 1);

    // Advance to 24 ticks = Day 2, Hour 0
    for (let i = 0; i < 19; i++) {
      clock.step();
    }
    assert.equal(clock.currentTick, 24);
    assert.equal(clock.simulationHour, 0);
    assert.equal(clock.simulationDay, 2);
  });

  test('supports pause, resume, and speed control', () => {
    const clock = new SimulationClock({ tickRate: 10, timeScale: 1.0 });

    assert.equal(clock.isPaused, false);
    clock.pause();
    assert.equal(clock.isPaused, true);

    clock.resume();
    assert.equal(clock.isPaused, false);

    // Speed control
    clock.setSpeed(3.0);
    assert.equal(clock.timeScale, 3.0);

    const tickInfo = clock.step();
    assert.equal(tickInfo.delta, 0.1 * 3.0);
  });

  test('getStatus returns comprehensive clock telemetry', () => {
    const clock = new SimulationClock({ tickRate: 20 });
    clock.tick();
    const status = clock.getStatus();

    assert.equal(status.currentTick, 1);
    assert.equal(status.simulationDay, 1);
    assert.equal(status.simulationHour, 1);
    assert.equal(status.tickRate, 20);
    assert.equal(typeof status.elapsedSimulatedTime, 'number');
  });
});

describe('Phase 4: WorldState (Comprehensive State Management)', () => {
  test('maintains population, resources, economy, buildings, agents, events, and metrics', () => {
    const state = new WorldState({
      tick: 0,
      dimensions: { width: 100, height: 100 },
      metrics: { population: 2500, treasury: 75000, energy: 6000 },
    });

    // Check Population
    assert.equal(state.population.total, 2500);
    assert.equal(typeof state.population.employed, 'number');
    assert.equal(typeof state.population.health, 'number');

    // Check Resources
    assert.equal(state.resources.energy.current, 6000);
    assert.equal(state.resources.water.current, 5000);
    assert.equal(state.resources.agriculture.current, 3000);

    // Check Economy
    assert.equal(state.economy.treasury, 75000);
    assert.equal(state.economy.taxRate, 0.15);

    // Check Buildings CRUD
    const bld = BuildingSystem.createBuilding('bld_1', 'power_plant');
    state.addBuilding(bld);
    assert.equal(state.getBuildingCount(), 1);
    assert.equal(state.getBuilding('bld_1').name, 'Fusion Grid Station');

    // Check Agents CRUD
    const agt = AgentSystem.createAgent('agt_1', { role: 'engineer' });
    state.addAgent(agt);
    assert.equal(state.getAgentCount(), 1);
    assert.equal(state.getAgent('agt_1').role, 'engineer');

    // Check Events CRUD
    state.addActiveEvent({
      id: 'evt_test_1',
      title: 'Solar Flare',
      remainingTicks: 5,
      severity: 2,
    });
    assert.equal(state.getActiveEvents().length, 1);

    // Check Metrics Synchronization
    assert.equal(state.getMetrics().population, 2500);
    assert.equal(state.getMetrics().treasury, 75000);
    assert.equal(state.getMetrics().energy, 6000);
  });

  test('deep clones cleanly without shared references', () => {
    const state = new WorldState({ tick: 10 });
    state.addBuilding(BuildingSystem.createBuilding('b_1', 'residential'));
    state.addAgent(AgentSystem.createAgent('a_1', { name: 'Ada Lovelace' }));

    const clone = state.clone();
    assert.equal(clone.tick, 10);
    assert.equal(clone.getAgent('a_1').name, 'Ada Lovelace');

    // Mutate clone and ensure original is untouched
    clone.updateAgent('a_1', { name: 'Modified Agent' });
    clone.updateResource('energy', 9999, false);

    assert.equal(state.getAgent('a_1').name, 'Ada Lovelace');
    assert.equal(clone.getAgent('a_1').name, 'Modified Agent');
    assert.notEqual(state.resources.energy.current, 9999);
  });

  test('serializes and deserializes accurately', () => {
    const state = new WorldState({ tick: 42 });
    state.addBuilding(BuildingSystem.createBuilding('bld_42', 'water_filter'));
    state.addActiveEvent({ id: 'evt_42', title: 'Rainstorm', remainingTicks: 3 });

    const serialized = state.serialize();
    assert.equal(typeof serialized, 'object');
    assert.equal(serialized.tick, 42);
    assert.equal(serialized.buildings.bld_42.id, 'bld_42');

    const deserialized = WorldState.deserialize(serialized);
    assert.equal(deserialized.tick, 42);
    assert.equal(deserialized.getBuilding('bld_42').id, 'bld_42');
    assert.equal(deserialized.getActiveEvents().length, 1);
  });
});

describe('Phase 4: StateManager', () => {
  test('supports read, update, snapshot, restore, and rollback', () => {
    const manager = new StateManager({ maxHistory: 20 });
    const s1 = new WorldState({ tick: 1, metrics: { treasury: 1000 } });
    const s2 = new WorldState({ tick: 2, metrics: { treasury: 2000 } });

    // Read & Commit
    manager.commit(s1);
    manager.commit(s2);
    assert.equal(manager.getState().tick, 2);
    assert.equal(manager.getState().metrics.treasury, 2000);

    // Update state
    manager.updateState((state) => {
      state.updateResource('water', 777, false);
    });
    assert.equal(manager.getState().resources.water.current, 777);

    // Snapshot
    const snap = manager.createSnapshot();
    assert.equal(snap.tick, 2);

    // Rollback / Restore
    const rolled = manager.rollback(1);
    assert.equal(rolled.tick, 1);
    assert.equal(manager.getState().metrics.treasury, 1000);
  });
});

describe('Phase 4: SimulationEngine (Deterministic Execution Pipeline)', () => {
  test('executes CLOCK -> EVENTS -> AGENTS -> ECONOMY -> RESOURCES -> WORLD STATE -> METRICS', () => {
    const engine = new SimulationEngine({ seed: 888, tickRate: 10 });
    engine.init();

    const state = engine.stateManager.getCurrentState();
    state.addBuilding(BuildingSystem.createBuilding('b1', 'power_plant'));
    state.addBuilding(BuildingSystem.createBuilding('b2', 'vertical_farm'));
    state.addAgent(AgentSystem.createAgent('a1', { role: 'engineer' }, engine.random));

    // Step 10 ticks
    for (let t = 1; t <= 10; t++) {
      const nextState = engine.step();
      assert.equal(nextState.tick, t);
      assert.equal(typeof nextState.metrics.happiness, 'number');
      assert.equal(typeof nextState.metrics.health, 'number');
      assert.equal(typeof nextState.metrics.stability, 'number');
      assert.equal(typeof nextState.metrics.sustainabilityIndex, 'number');
    }

    const status = engine.getStatus();
    assert.equal(status.clock.currentTick, 10);
    assert.equal(status.stateSummary.buildingsCount, 2);
    assert.equal(status.stateSummary.agentsCount, 1);
  });

  test('is strictly deterministic across identical seeds', () => {
    const runSimulation = (seed) => {
      const engine = new SimulationEngine({ seed, tickRate: 10 });
      engine.init();
      const state = engine.stateManager.getCurrentState();

      state.addBuilding(BuildingSystem.createBuilding('b1', 'power_plant'));
      state.addBuilding(BuildingSystem.createBuilding('b2', 'commercial'));
      state.addAgent(AgentSystem.createAgent('a1', { role: 'worker' }, engine.random));
      state.addAgent(AgentSystem.createAgent('a2', { role: 'trader' }, engine.random));

      for (let i = 0; i < 50; i++) {
        engine.step();
      }

      return engine.stateManager.getCurrentState().serialize();
    };

    const runA = runSimulation(12345);
    const runB = runSimulation(12345);
    const runC = runSimulation(99999);

    // Deep equality for identical seeds
    assert.deepEqual(runA.metrics, runB.metrics);
    assert.deepEqual(runA.population, runB.population);
    assert.deepEqual(runA.resources, runB.resources);
    assert.deepEqual(runA.economy, runB.economy);

    // Different seed should yield different pseudorandom trace
    assert.notDeepEqual(runA.resources, runC.resources);
  });

  test('runs standalone independently without UI dependencies', () => {
    const result = runHeadlessSimulation({ ticks: 20, seed: 777, agents: 10, buildings: 4, json: true });
    assert.equal(result.totalTicks, 20);
    assert.equal(result.seed, 777);
    assert.equal(typeof result.finalMetrics.stability, 'number');
  });
});
