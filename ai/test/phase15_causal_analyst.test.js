import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  CausalAnalyzer,
  SimulationAnalyzer,
} from '../src/index.js';

describe('Phase 15: SimulationAnalyzer Empirical Fact Extraction', () => {
  it('extracts verifiable metrics deltas and event rankings without inventing data', () => {
    const snapshots = [
      {
        tick: 0,
        population: { total: 10000, unemploymentRate: 0.05, averageHappiness: 80 },
        economy: { treasury: 50000, gdp: 120000 },
        resources: { water: 5000, energy: 5000 },
      },
      {
        tick: 20,
        population: { total: 9800, unemploymentRate: 0.09, averageHappiness: 68 },
        economy: { treasury: 42000, gdp: 105000 },
        resources: { water: 1200, energy: 4800 },
      },
    ];

    const events = [
      {
        id: 'evt_1',
        title: 'Water Shortage Crisis',
        type: 'resource_shortage_water',
        severity: 4,
        tick: 10,
        cause: 'Aquifer depletion',
      },
    ];

    const evidence = SimulationAnalyzer.extractEvidence({ snapshots, events });

    assert.strictEqual(evidence.hasData, true);
    assert.strictEqual(evidence.totalSnapshots, 2);
    assert.strictEqual(evidence.deltas.population.delta, -200);
    assert.strictEqual(evidence.deltas.unemployment.delta, 4); // 5% -> 9%
    assert.strictEqual(evidence.deltas.water.delta, -3800); // 5000 -> 1200
    assert.strictEqual(evidence.largestImpactEvent.title, 'Water Shortage Crisis');
  });
});

describe('Phase 15: CausalAnalyzer Inquiries & Structured Responses', () => {
  const mockHistory = {
    snapshots: [
      {
        tick: 0,
        population: { total: 10000, unemploymentRate: 0.04, averageHappiness: 82 },
        economy: { treasury: 60000, gdp: 130000 },
        resources: { water: 5000, energy: 5000 },
      },
      {
        tick: 30,
        population: { total: 9750, unemploymentRate: 0.08, averageHappiness: 65, emigrants: 250 },
        economy: { treasury: 45000, gdp: 110000 },
        resources: { water: 1100, energy: 4600 },
      },
    ],
    events: [
      {
        id: 'evt_water_01',
        title: 'Severe Water Shortage',
        type: 'resource_shortage_water',
        severity: 4,
        tick: 15,
        cause: 'Reservoir contamination and drought',
      },
    ],
  };

  it('answers "Why did unemployment increase?" with Observation, Evidence, and Possible Cause', async () => {
    const causal = new CausalAnalyzer();
    const res = await causal.answerCausalInquiry('Why did unemployment increase?', mockHistory);

    assert.ok(res.observation.includes('unemployment'));
    assert.ok(res.evidence.length > 0);
    assert.ok(res.possibleCause.length > 0);
    assert.ok(res.confidence.includes('Evidence'));
    assert.ok(res.disclaimer.includes('SIMULATION RESULT'));
  });

  it('answers "Which event had the largest impact?" identifying actual recorded event', async () => {
    const causal = new CausalAnalyzer();
    const res = await causal.answerCausalInquiry('Which event had the largest impact?', mockHistory);

    assert.ok(res.observation.includes('Severe Water Shortage'));
    assert.strictEqual(res.relatedEvents[0], 'Severe Water Shortage');
    assert.ok(res.evidence.some((e) => e.includes('Severity Level: 4')));
  });

  it('answers "What changed after the water shortage?" referencing real water numbers', async () => {
    const causal = new CausalAnalyzer();
    const res = await causal.answerCausalInquiry('What changed after the water shortage?', mockHistory);

    assert.ok(res.evidence.some((e) => e.includes('Water Reserves')));
    assert.ok(res.observation.includes('water'));
  });
});
