import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  ExperimentLab,
  ExperimentRunner,
  StatisticalAnalysis,
  WorldState,
} from '../src/index.js';

describe('Phase 13: StatisticalAnalysis Primitives', () => {
  it('calculates mean, variance, range, and quartiles accurately', () => {
    const values = [10, 20, 30, 40, 50];
    const mean = StatisticalAnalysis.mean(values);
    assert.strictEqual(mean, 30);

    const { variance, stdDev } = StatisticalAnalysis.variance(values);
    assert.strictEqual(variance, 250);
    assert.strictEqual(stdDev, 15.811);

    const range = StatisticalAnalysis.range(values);
    assert.strictEqual(range.min, 10);
    assert.strictEqual(range.max, 50);
    assert.strictEqual(range.range, 40);

    const q = StatisticalAnalysis.quartiles(values);
    assert.strictEqual(q.median, 30);
    assert.strictEqual(q.q1, 20);
    assert.strictEqual(q.q3, 40);
  });

  it('generates binned histogram distributions', () => {
    const values = [5, 8, 12, 18, 22, 29, 35, 41, 48, 55];
    const dist = StatisticalAnalysis.distribution(values, 5);
    assert.strictEqual(dist.length, 5);
    const totalCount = dist.reduce((acc, b) => acc + b.count, 0);
    assert.strictEqual(totalCount, 10);
  });
});

describe('Phase 13: ExperimentRunner & Multi-Run Simulations', () => {
  it('executes multiple runs with variable modifications and compiles statistics', async () => {
    const runner = new ExperimentRunner();

    const spec = {
      name: 'Water Availability Stress Test',
      startingConditions: {
        population: 5000,
        resources: { water: 1000, energy: 5000 },
      },
      variables: {
        waterAvailability: 200, // Reduced water
      },
      durationDays: 5,
      ticksPerDay: 1,
      runs: 4,
      seedBehavior: 'incremental',
      baseSeed: 101,
    };

    const results = await runner.runExperiment(spec);

    assert.ok(results, 'Experiment results should be returned');
    assert.strictEqual(results.runResults.length, 4, 'Should execute all 4 runs');
    assert.ok(results.executionTimeMs >= 0);
    assert.ok(results.disclaimer.includes('SIMULATION RESULT'));

    // Check aggregated stats
    const stats = results.aggregatedStats;
    assert.strictEqual(stats.totalRuns, 4);
    assert.ok(stats.metrics.population.mean > 0);
    assert.ok(stats.metrics.water.mean !== undefined);
    assert.ok(stats.metrics.population.distribution.length > 0);
    assert.ok(stats.metrics.population.variance >= 0);
  });
});

describe('Phase 13: ExperimentLab Lifecycle & Comparison', () => {
  it('manages experiments registry and compares two scenarios', async () => {
    const lab = new ExperimentLab();

    // Experiment A: Baseline High Water
    const expA = await lab.runExperiment({
      name: 'Scenario A: High Water Buffer',
      startingConditions: { population: 2000 },
      variables: { waterAvailability: 2000 },
      durationDays: 3,
      runs: 3,
      baseSeed: 50,
    });

    // Experiment B: Low Water Drought
    const expB = await lab.runExperiment({
      name: 'Scenario B: Severe Water Scarcity',
      startingConditions: { population: 2000 },
      variables: { waterAvailability: 150 },
      durationDays: 3,
      runs: 3,
      baseSeed: 50,
    });

    assert.strictEqual(expA.status, 'completed');
    assert.strictEqual(expB.status, 'completed');

    // List experiments
    const all = lab.listExperiments();
    assert.strictEqual(all.length, 2);

    // Compare both experiments
    const comparison = lab.compareExperiments([expA.id, expB.id]);

    assert.strictEqual(comparison.experimentCount, 2);
    assert.ok(comparison.metricsComparison.water.length === 2);
    assert.ok(comparison.metricsComparison.population.length === 2);
    assert.ok(comparison.disclaimer.includes('SIMULATION RESULT'));
  });
});

