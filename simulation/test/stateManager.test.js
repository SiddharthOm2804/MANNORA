import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { StateManager } from '../src/core/StateManager.js';
import { WorldState } from '../src/core/WorldState.js';

describe('StateManager Component', () => {
  test('reads active state and snapshots', () => {
    const sm = new StateManager();
    assert.ok(sm.getCurrentState() instanceof WorldState);
    assert.equal(sm.getState().tick, 0);

    const s1 = new WorldState({ tick: 1, metrics: { treasury: 500 } });
    sm.commit(s1);

    assert.equal(sm.getState().tick, 1);
    assert.equal(sm.getSnapshot(1).metrics.treasury, 500);
  });

  test('updates state via mutator functions and partial objects', () => {
    const sm = new StateManager();
    sm.updateState((state) => {
      state.updateResource('energy', 9500, false);
      state.updateEconomy({ taxRate: 0.22 });
    });

    assert.equal(sm.getState().resources.energy.current, 9500);
    assert.equal(sm.getState().economy.taxRate, 0.22);

    sm.updateState({
      metrics: { stability: 99 },
    });
    assert.equal(sm.getState().metrics.stability, 99);
  });

  test('snapshots state and maintains history within maxHistory', () => {
    const sm = new StateManager({ maxHistory: 3 });
    for (let t = 1; t <= 5; t++) {
      sm.commit(new WorldState({ tick: t }));
    }

    const ticks = sm.getHistoryTicks();
    assert.equal(ticks.length, 3);
    assert.deepEqual(ticks, [3, 4, 5]);

    const summary = sm.getHistorySummary();
    assert.equal(summary.totalSnapshots, 3);
    assert.equal(summary.earliestTick, 3);
    assert.equal(summary.latestTick, 5);
  });

  test('restores state from snapshot or tick rollback', () => {
    const sm = new StateManager({ maxHistory: 10 });
    sm.commit(new WorldState({ tick: 1, metrics: { population: 100 } }));
    sm.commit(new WorldState({ tick: 2, metrics: { population: 200 } }));
    sm.commit(new WorldState({ tick: 3, metrics: { population: 300 } }));

    // Rollback to tick 2
    const restored = sm.restoreState(2);
    assert.equal(restored.tick, 2);
    assert.equal(sm.getState().metrics.population, 200);

    // Subsequent tick 3 should be pruned from history (initial tick 0 remains)
    assert.deepEqual(sm.getHistoryTicks(), [0, 1, 2]);
  });
});
