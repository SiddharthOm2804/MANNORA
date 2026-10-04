import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  SimulationEngine,
  WorldState,
  SimulationClock,
  StateManager,
  RandomEngine,
} from '../src/index.js';

describe('RandomEngine (Mulberry32 PRNG)', () => {
  test('generates deterministic pseudorandom numbers given a seed', () => {
    const rng1 = new RandomEngine(42);
    const rng2 = new RandomEngine(42);

    const stream1 = [rng1.nextFloat(), rng1.nextFloat(), rng1.nextInt(1, 100)];
    const stream2 = [rng2.nextFloat(), rng2.nextFloat(), rng2.nextInt(1, 100)];

    assert.deepEqual(stream1, stream2);
  });

  test('shuffle produces deterministic permutation', () => {
    const rng = new RandomEngine(99);
    const arr = [1, 2, 3, 4, 5];
    const shuffled = rng.shuffle(arr);

    assert.equal(shuffled.length, arr.length);
    assert.deepEqual(shuffled.slice().sort(), arr.slice().sort());
  });
});

describe('SimulationClock', () => {
  test('advances ticks and simulated seconds', () => {
    const clock = new SimulationClock({ tickRate: 10 });
    assert.equal(clock.currentTick, 0);

    const step1 = clock.tick();
    assert.equal(step1.tick, 1);
    assert.equal(step1.delta, 0.1);
    assert.equal(clock.currentTick, 1);

    const step2 = clock.tick();
    assert.equal(step2.tick, 2);
    assert.equal(clock.elapsedSimulatedTime, 0.2);
  });

  test('respects time scale modifier', () => {
    const clock = new SimulationClock({ tickRate: 10, timeScale: 2.0 });
    const step = clock.tick();
    assert.equal(step.delta, 0.2);
  });
});

describe('WorldState', () => {
  test('manages entities and metric updates', () => {
    const state = new WorldState({
      tick: 0,
      dimensions: { width: 50, height: 50 },
      metrics: { population: 100 },
    });

    state.setEntity('agent_1', { x: 10, y: 20 });
    assert.equal(state.getEntityCount(), 1);
    assert.deepEqual(state.getEntity('agent_1'), { id: 'agent_1', x: 10, y: 20 });

    state.updateMetrics({ population: 105 });
    assert.equal(state.getMetrics().population, 105);
  });

  test('deep clones cleanly without shared references', () => {
    const state = new WorldState({ tick: 5 });
    state.setEntity('agent_1', { x: 10, y: 20 });

    const clone = state.clone();
    assert.equal(clone.tick, 5);
    assert.deepEqual(clone.getEntity('agent_1'), { id: 'agent_1', x: 10, y: 20 });

    // Mutate clone and assert original is unchanged
    clone.setEntity('agent_1', { x: 99, y: 99 });
    assert.equal(state.getEntity('agent_1').x, 10);
    assert.equal(clone.getEntity('agent_1').x, 99);
  });
});

describe('StateManager', () => {
  test('commits and retrieves state snapshots', () => {
    const manager = new StateManager({ maxHistory: 10 });
    const s1 = new WorldState({ tick: 1 });
    const s2 = new WorldState({ tick: 2 });

    manager.commit(s1);
    manager.commit(s2);

    assert.equal(manager.getCurrentState().tick, 2);
    const snap1 = manager.getSnapshot(1);
    assert.equal(snap1.tick, 1);
  });

  test('rolls back to historical snapshot', () => {
    const manager = new StateManager({ maxHistory: 10 });
    manager.commit(new WorldState({ tick: 1, metrics: { treasury: 500 } }));
    manager.commit(new WorldState({ tick: 2, metrics: { treasury: 1000 } }));

    const rolledBack = manager.rollback(1);
    assert.equal(rolledBack.tick, 1);
    assert.equal(manager.getCurrentState().getMetrics().treasury, 500);
  });
});

describe('SimulationEngine', () => {
  test('initializes and steps deterministically', () => {
    const engine = new SimulationEngine({ seed: 777, tickRate: 20 });
    engine.init();

    let subsystemRan = false;
    engine.registerSystem('testSystem', (state, delta, random) => {
      subsystemRan = true;
      state.updateMetrics({ population: 50 });
    });

    const nextState = engine.step();
    assert.equal(subsystemRan, true);
    assert.equal(nextState.tick, 1);
    assert.equal(nextState.getMetrics().population, 50);

    const status = engine.getStatus();
    assert.equal(status.clock.currentTick, 1);
    assert.equal(status.isInitialized, true);
  });
});
