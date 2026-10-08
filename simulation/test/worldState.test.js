import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { WorldState } from '../src/core/WorldState.js';

describe('WorldState Component', () => {
  test('maintains all core dimensions: population, resources, economy, buildings, agents, events, metrics', () => {
    const ws = new WorldState({
      tick: 5,
      population: { total: 5000, education: 90 },
      resources: { energy: { current: 8000, max: 25000 } },
      economy: { treasury: 150000, taxRate: 0.18 },
      metrics: { stability: 92 },
    });

    assert.equal(ws.tick, 5);
    assert.equal(ws.population.total, 5000);
    assert.equal(ws.population.education, 90);
    assert.equal(ws.resources.energy.current, 8000);
    assert.equal(ws.resources.energy.max, 25000);
    assert.equal(ws.economy.treasury, 150000);
    assert.equal(ws.economy.taxRate, 0.18);
    assert.equal(ws.metrics.stability, 92);
  });

  test('handles buildings collection lifecycle', () => {
    const ws = new WorldState();
    ws.addBuilding({ id: 'b_hab_1', type: 'residential', name: 'Arcology Alpha', level: 2 });

    assert.equal(ws.getBuildingCount(), 1);
    assert.equal(ws.getBuilding('b_hab_1').name, 'Arcology Alpha');
    assert.equal(ws.getBuilding('b_hab_1').level, 2);

    ws.updateBuilding('b_hab_1', { health: 85, efficiency: 0.95 });
    assert.equal(ws.getBuilding('b_hab_1').health, 85);
    assert.equal(ws.getBuilding('b_hab_1').efficiency, 0.95);

    const deleted = ws.removeBuilding('b_hab_1');
    assert.equal(deleted, true);
    assert.equal(ws.getBuildingCount(), 0);
  });

  test('handles agents collection lifecycle', () => {
    const ws = new WorldState();
    ws.addAgent({ id: 'a_007', name: 'James Bond', role: 'operative' });

    assert.equal(ws.getAgentCount(), 1);
    assert.equal(ws.getAgent('a_007').name, 'James Bond');

    ws.updateAgent('a_007', { state: { wealth: 5000 } });
    assert.equal(ws.getAgent('a_007').state.wealth, 5000);

    const removed = ws.removeAgent('a_007');
    assert.equal(removed, true);
    assert.equal(ws.getAgentCount(), 0);
  });

  test('handles events scheduling, active duration, and historical logging', () => {
    const ws = new WorldState({ tick: 10 });
    ws.scheduleEvent({ id: 'future_evt', triggerTick: 15, title: 'Upcoming Harvest' });
    assert.equal(ws.getScheduledEvents().length, 1);

    ws.addActiveEvent({ id: 'active_1', title: 'Power Surge', remainingTicks: 3 });
    assert.equal(ws.getActiveEvents().length, 1);

    ws.logEvent({ id: 'active_1', title: 'Power Surge', outcome: 'RESOLVED' });
    assert.equal(ws.getEventLog().length, 1);
  });

  test('synchronizes top metrics with deep state structures', () => {
    const ws = new WorldState();
    ws.updateMetrics({ population: 3333, treasury: 99999, energy: 1234 });

    assert.equal(ws.population.total, 3333);
    assert.equal(ws.economy.treasury, 99999);
    assert.equal(ws.resources.energy.current, 1234);
    assert.equal(ws.getMetrics().population, 3333);
  });

  test('deep cloning creates isolated instances', () => {
    const ws = new WorldState({ tick: 1 });
    ws.addBuilding({ id: 'b1', name: 'Base Station' });
    ws.addAgent({ id: 'a1', name: 'Citizen Kane' });

    const clone = ws.clone();
    clone.updateBuilding('b1', { name: 'Mutated Station' });
    clone.updateAgent('a1', { name: 'Mutated Citizen' });

    assert.equal(ws.getBuilding('b1').name, 'Base Station');
    assert.equal(clone.getBuilding('b1').name, 'Mutated Station');
    assert.equal(ws.getAgent('a1').name, 'Citizen Kane');
    assert.equal(clone.getAgent('a1').name, 'Mutated Citizen');
  });
});
