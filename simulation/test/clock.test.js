import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { SimulationClock } from '../src/core/SimulationClock.js';

describe('SimulationClock Component', () => {
  test('initializes with default values', () => {
    const clock = new SimulationClock();
    assert.equal(clock.currentTick, 0);
    assert.equal(clock.simulationDay, 1);
    assert.equal(clock.simulationHour, 0);
    assert.equal(clock.tickRate, 10);
    assert.equal(clock.timeScale, 1.0);
    assert.equal(clock.isRunning, false);
    assert.equal(clock.isPaused, false);
  });

  test('advances day and hour deterministically with step() and tick()', () => {
    const clock = new SimulationClock({ tickRate: 10, ticksPerHour: 2, hoursPerDay: 24 });

    // Tick 1 (30 mins into hour 0)
    const t1 = clock.tick();
    assert.equal(t1.tick, 1);
    assert.equal(t1.day, 1);
    assert.equal(t1.hour, 0);
    assert.equal(t1.dayChanged, false);
    assert.equal(t1.hourChanged, false);

    // Tick 2 (hour 1 starts)
    const t2 = clock.step();
    assert.equal(t2.tick, 2);
    assert.equal(t2.day, 1);
    assert.equal(t2.hour, 1);
    assert.equal(t2.hourChanged, true);

    // Advance 46 more ticks -> 48 ticks total = Day 2, Hour 0
    for (let i = 0; i < 46; i++) {
      clock.tick();
    }
    assert.equal(clock.currentTick, 48);
    assert.equal(clock.simulationDay, 2);
    assert.equal(clock.simulationHour, 0);
  });

  test('pause and resume control states', () => {
    const clock = new SimulationClock();
    clock.pause();
    assert.equal(clock.isPaused, true);
    clock.resume();
    assert.equal(clock.isPaused, false);
  });

  test('speed control via setTimeScale and setSpeed', () => {
    const clock = new SimulationClock({ tickRate: 10 });
    clock.setTimeScale(2.5);
    assert.equal(clock.timeScale, 2.5);

    clock.setSpeed(5.0);
    assert.equal(clock.timeScale, 5.0);

    const stepResult = clock.step();
    assert.equal(stepResult.delta, 0.1 * 5.0);
  });

  test('validates negative or zero rates', () => {
    const clock = new SimulationClock();
    assert.throws(() => clock.setTickRate(-1), /must be positive/);
    assert.throws(() => clock.setTimeScale(-0.5), /must be non-negative/);
  });
});
