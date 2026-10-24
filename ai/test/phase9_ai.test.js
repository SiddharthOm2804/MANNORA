import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  CitizenAI,
  GovernmentAI,
  AnalystAI,
  MemoryManager,
  RetrievalService,
  DeterministicRuleFallbackProvider,
  AIProviderFactory,
} from '../src/index.js';

describe('Phase 9: AI Abstraction & Deterministic Fallback', () => {
  it('DeterministicRuleFallbackProvider generates simulation-consistent JSON without external APIs', async () => {
    const provider = new DeterministicRuleFallbackProvider();

    const citizenRes = await provider.complete('Citizen reflection prompt');
    assert.ok(citizenRes.text, 'Response should contain text');
    assert.strictEqual(citizenRes.fallback, true, 'Fallback flag should be true');

    const parsed = JSON.parse(citizenRes.text);
    assert.ok(parsed.reflection, 'Should have reflection property');
    assert.ok(parsed.mood, 'Should have mood property');

    const govRes = await provider.complete('Government policy proposal');
    const govParsed = JSON.parse(govRes.text);
    assert.ok(Array.isArray(govParsed.recommendations), 'Should contain policy recommendations');

    const analystRes = await provider.complete('Analyst telemetry report');
    const analystParsed = JSON.parse(analystRes.text);
    assert.ok(analystParsed.systemHealthScore > 0, 'Should have health score');
  });

  it('generates consistent pseudo-embeddings and unit vectors', async () => {
    const provider = new DeterministicRuleFallbackProvider();
    const vec = await provider.embed('Economic collapse in Sector 4');

    assert.strictEqual(vec.length, 64, 'Vector length should be 64');
    const mag = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
    assert.ok(Math.abs(mag - 1.0) < 0.05, 'Vector must be normalized to unit length');
  });

  it('AIProviderFactory gracefully defaults to fallback provider when no API keys are configured', () => {
    const factory = new AIProviderFactory({ provider: 'openai', apiKey: '' });
    const provider = factory.getProvider();

    assert.ok(provider, 'Provider should exist');
    assert.strictEqual(provider.name, 'rule-fallback', 'Should safely use rule-fallback provider');
  });
});

describe('Phase 9: MemoryManager & RetrievalService', () => {
  it('filters out mundane events and commits significant milestones to episodic memory', async () => {
    const memoryManager = new MemoryManager();

    // 1. Mundane event (below 0.60 threshold)
    const mundane = await memoryManager.recordMilestone({
      type: 'general_memory',
      description: 'Citizen walked 5 meters to the grocery lot.',
      importance: 0.25,
      tick: 10,
    });
    assert.strictEqual(mundane, null, 'Mundane event should not be committed to long-term memory');
    assert.strictEqual(memoryManager.getEpisodicMemories().length, 0);
    assert.strictEqual(memoryManager.getWorkingMemories().length, 1);

    // 2. Significant milestone (e.g. Major Disaster / Famine)
    const disaster = await memoryManager.recordMilestone({
      type: MemoryManager.EVENT_TYPES.MAJOR_DISASTER,
      description: 'Severe high-atmosphere solar storm crippled grid energy by 25%.',
      importance: 0.90,
      emotionalValence: -0.7,
      tick: 20,
    });
    assert.ok(disaster, 'Significant disaster should be committed');
    assert.strictEqual(memoryManager.getEpisodicMemories().length, 1);
    assert.ok(disaster.embedding, 'Memory record should have embedding attached');
  });

  it('RetrievalService ranks memories by semantic similarity, recency, and importance', async () => {
    const retrieval = new RetrievalService();
    const provider = new DeterministicRuleFallbackProvider();

    const mem1 = {
      tick: 20,
      type: 'job_change',
      description: 'Promoted to Chief Systems Architect at Tech Guild',
      importance: 0.85,
      embedding: await provider.embed('Promoted to Chief Systems Architect at Tech Guild'),
    };

    const mem2 = {
      tick: 190,
      type: 'major_financial_loss',
      description: 'Lost 800 credits in market commodity crash',
      importance: 0.95,
      embedding: await provider.embed('Lost 800 credits in market commodity crash'),
    };

    const results = await retrieval.retrieve('Tell me about my financial crisis and debt', [mem1, mem2], {
      currentTick: 200,
      topK: 2,
    });

    assert.strictEqual(results.length, 2);
    assert.strictEqual(results[0].memory.type, 'major_financial_loss', 'Most relevant financial memory ranked top');
    assert.ok(results[0].score >= results[1].score);
  });
});

describe('Phase 9: CitizenAI, GovernmentAI & AnalystAI', () => {
  it('CitizenAI reflects on life state and retrieves salient memories', async () => {
    const citizen = new CitizenAI({
      id: 'agt_test_01',
      name: 'Elena Rostova',
      role: 'engineer',
    });

    await citizen.recordMilestone({
      type: MemoryManager.EVENT_TYPES.JOB_CHANGE,
      description: 'Secured permanent technician tenure at Fusion Grid Station',
      importance: 0.85,
      tick: 12,
    });

    const reflection = await citizen.reflectOnLife(
      { occupation: 'engineer', wealth: 250, healthState: { health: 95 } },
      { tick: 50 }
    );

    assert.ok(reflection, 'Reflection should be generated');
    assert.strictEqual(reflection.citizenId, 'agt_test_01');
    assert.ok(reflection.reflection, 'Should have reflective text');
    assert.ok(reflection.retrievedMemoriesCount >= 1, 'Should have incorporated memory');
  });

  it('GovernmentAI produces policy assessment and recommendations', async () => {
    const govAI = new GovernmentAI();

    const assessment = await govAI.evaluateGovernance({
      population: 1250,
      stability: 78,
      happiness: 82,
      crimeRate: 4,
      treasury: 64000,
      taxRate: 0.15,
      deficits: { energy: false, water: false },
    });

    assert.ok(assessment, 'Governance advice should be returned');
    assert.ok(assessment.recommendations.length > 0, 'Should propose policy recommendations');
    assert.ok(assessment.projectedImpact, 'Should estimate systemic impact');
  });

  it('AnalystAI evaluates systemic stability and macro telemetry', async () => {
    const analyst = new AnalystAI();

    const report = await analyst.analyzeSystemState(
      { population: 1400, health: 90, happiness: 85, sustainabilityIndex: 82 },
      { gdp: 145000, inflationRate: 0.022, treasury: 52000 },
      { harmonyIndex: 84, networkDensity: 0.36 }
    );

    assert.ok(report, 'Diagnostic report must exist');
    assert.ok(report.systemHealthScore >= 0 && report.systemHealthScore <= 100);
    assert.ok(report.executiveSummary, 'Should have executive summary');
  });
});
