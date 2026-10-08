import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { SimulationEngine } from '../src/core/SimulationEngine.js';

describe('SimulationEngine Execution Pipeline', () => {
  test('strictly follows execution order CLOCK -> EVENTS -> AGENTS -> ECONOMY -> RESOURCES -> WORLD STATE -> METRICS', () => {
    const engine = new SimulationEngine({ seed: 42, useDefaultSystems: false });
    engine.init();

    const executionLog = [];

    // Register test spy subsystems with exact pipeline priorities
    engine.registerSystem('events', () => executionLog.push('EVENTS'), 10);
    engine.registerSystem('agents', () => executionLog.push('AGENTS'), 20);
    engine.registerSystem('economy', () => executionLog.push('ECONOMY'), 30);
    engine.registerSystem('resources', () => executionLog.push('RESOURCES'), 40);
    engine.registerSystem('worldState', () => executionLog.push('WORLD STATE'), 50);
    engine.registerSystem('metrics', () => executionLog.push('METRICS'), 60);

    engine.step();

    assert.deepEqual(executionLog, [
      'EVENTS',
      'AGENTS',
      'ECONOMY',
      'RESOURCES',
      'WORLD STATE',
      'METRICS',
    ]);
  });

  test('emits standard lifecycle events', () => {
    const engine = new SimulationEngine({ seed: 777 });
    engine.init();

    let tickFired = false;
    engine.on('tick', (data) => {
      tickFired = true;
      assert.equal(data.tick, 1);
    });

    engine.step();
    assert.equal(tickFired, true);
  });
});
