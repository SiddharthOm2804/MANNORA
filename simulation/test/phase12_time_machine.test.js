import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  SimulationEngine,
  WorldState,
  TimeMachine,
  SnapshotSystem,
  BranchEngine,
  CounterfactualEngine,
} from '../src/index.js';

describe('Phase 12: Time Machine & Temporal Branching Architecture', () => {

  test('TimeMachine controls: pause, resume, rewind, jumpToDay, and jumpToTick', () => {
    const sim = new SimulationEngine({ seed: 101 });
    sim.init();

    // 1. Advance to Tick 30
    for (let i = 0; i < 30; i++) {
      sim.step();
    }
    assert.equal(sim.clock.currentTick, 30);

    // 2. Pause & Resume
    sim.timeMachine.pause();
    assert.equal(sim.clock.isPaused, true);
    sim.timeMachine.resume();
    assert.equal(sim.clock.isPaused, false);

    // 3. Rewind to Tick 15
    sim.timeMachine.rewind(15);
    assert.equal(sim.clock.currentTick, 15);
    assert.equal(sim.stateManager.getCurrentState().tick, 15);

    // 4. Jump to Day 2 (Day 2 starts at Tick 24 with 24 hours/day)
    sim.timeMachine.jumpToDay(2);
    assert.equal(sim.clock.currentTick, 24);
    assert.equal(sim.clock.simulationDay, 2);

    // 5. Jump to future Tick 35
    sim.timeMachine.jumpToTick(35);
    assert.equal(sim.clock.currentTick, 35);
  });

  test('SnapshotSystem captures, indexes, and restores historical WorldState', () => {
    const snapshotSystem = new SnapshotSystem();
    const state = new WorldState({
      tick: 48,
      population: { total: 1250 },
      resources: { water: { current: 3400, max: 10000 } },
      economy: { treasury: 25000 },
    });

    // Capture snapshot
    const snap = snapshotSystem.capture(state, {
      label: 'Pre-Disaster Milestone',
      tag: 'MILESTONE',
    });

    assert.ok(snap.id);
    assert.equal(snap.tick, 48);
    assert.equal(snap.label, 'Pre-Disaster Milestone');
    assert.equal(snap.metrics.population, 1250);

    // Mutate state
    state.population.total = 800;
    state.resources.water.current = 1000;

    // Restore state from snapshot
    const restored = snapshotSystem.restore(snap.id);
    assert.equal(restored.population.total, 1250, 'Restored state must preserve historical population');
    assert.equal(restored.resources.water.current, 3400, 'Restored state must preserve historical water level');
  });

  test('BranchEngine creates branches, applies variable/policy mutations, and preserves original simulation', () => {
    const branchEngine = new BranchEngine();
    const originalState = new WorldState({
      tick: 50,
      resources: {
        water: { current: 100, max: 1000, production: 10, consumption: 10 },
      },
      economy: { taxRate: 0.15 },
    });

    // 1. Create branch and change water supply to 130
    const branch = branchEngine.createBranch({
      name: 'Branch Alpha // Water Infrastructure Surge',
      baseState: originalState,
      variableMutations: {
        resources: { water: { current: 130 } },
        economy: { taxRate: 0.12 },
      },
    });

    // 2. Verify original state was NOT modified
    assert.equal(originalState.resources.water.current, 100, 'Original simulation must not be overwritten');
    assert.equal(originalState.economy.taxRate, 0.15, 'Original tax rate must remain untouched');

    // 3. Verify branch state holds the counterfactual intervention
    assert.equal(branch.currentState.resources.water.current, 130, 'Branch water supply must equal mutated 130');
    assert.equal(branch.currentState.economy.taxRate, 0.12, 'Branch tax rate must equal mutated 0.12');
    assert.equal(branch.mutationsApplied.length, 1);
  });

  test('CounterfactualEngine runs both simulations in parallel and compares population, economy, resources, unemployment, satisfaction, and events', () => {
    const counterfactual = new CounterfactualEngine();

    // Baseline: water supply = 100
    const baselineState = new WorldState({
      tick: 20,
      population: { total: 1000, health: 80, happiness: 75, employed: 600, unemployed: 50, unemploymentRate: 0.05 },
      resources: {
        water: { current: 100, max: 2000, production: 20, consumption: 25 }, // slight deficit
        energy: { current: 1500, max: 2000, production: 50, consumption: 30 },
      },
      economy: { treasury: 30000, taxRate: 0.15, gdp: 50000 },
    });

    // Branch: water supply = 130
    const branchState = baselineState.clone();
    branchState.resources.water.current = 130;
    branchState.resources.water.production = 40; // surplus

    // Run both simulations for 10 ticks
    const report = counterfactual.runComparison({
      baselineState,
      branchState,
      ticks: 10,
      seed: 999,
    });

    assert.equal(report.ticksEvaluated, 10);
    assert.ok(report.comparison, 'Report must contain structured comparison');

    const comp = report.comparison;

    // Verify all 6 required comparison domains exist and hold quantitative deltas
    assert.ok('population' in comp, 'Must compare population');
    assert.ok('economy' in comp, 'Must compare economy');
    assert.ok('resources' in comp, 'Must compare resource levels');
    assert.ok('unemployment' in comp, 'Must compare unemployment');
    assert.ok('publicSatisfaction' in comp, 'Must compare public satisfaction');
    assert.ok('majorEvents' in comp, 'Must compare major events');

    // Counterfactual water should be substantially higher
    assert.ok(
      comp.resources.water.branch > comp.resources.water.baseline,
      'Branch water levels must be higher than baseline'
    );
    assert.ok(typeof comp.publicSatisfaction.baselineScore === 'number');
    assert.ok(typeof comp.unemployment.baselineRate === 'number');
    assert.equal(report.timelineSeries.length, 11); // step 0 through 10
  });

  test('TimeMachine integrates seamlessly with SimulationEngine for full end-to-end branch workflow', () => {
    const sim = new SimulationEngine({ seed: 555 });
    sim.init({
      resources: { water: { current: 100, max: 1000 } },
    });

    // Step 5 ticks
    for (let i = 0; i < 5; i++) sim.step();

    // Snapshot at Tick 5
    const snap = sim.timeMachine.captureSnapshot('Milestone at Tick 5');

    // Create branch from snapshot with water = 130
    const branch = sim.timeMachine.createBranch({
      name: 'Counterfactual Branch',
      snapshotId: snap.id,
      variableMutations: {
        resources: { water: { current: 130 } },
      },
    });

    assert.equal(branch.currentState.resources.water.current, 130);
    assert.equal(sim.stateManager.getCurrentState().resources.water.current < 130, true);

    // Run counterfactual experiment
    const experiment = sim.timeMachine.runCounterfactualExperiment({
      branchId: branch.id,
      ticks: 8,
    });

    assert.ok(experiment.comparison.resources.water.branch > experiment.comparison.resources.water.baseline);
  });
});
