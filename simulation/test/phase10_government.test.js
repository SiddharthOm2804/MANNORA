import { describe, it } from 'node:test';
import assert from 'node:assert';
import { GovernmentEngine } from '../src/government/GovernmentEngine.js';
import { PolicyEngine } from '../src/government/PolicyEngine.js';
import { PublicServiceEngine } from '../src/government/PublicServiceEngine.js';
import { WorldState } from '../src/core/WorldState.js';
import { SimulationEngine } from '../src/core/SimulationEngine.js';
import { RandomEngine } from '../src/core/RandomEngine.js';

describe('Phase 10: PolicyEngine', () => {
  it('enacts policies and modifies simulation parameters like tax rates', () => {
    const policyEngine = new PolicyEngine({ activePolicies: [] });
    const worldState = new WorldState();
    worldState.economy.taxRate = 0.15;

    // Enact Progressive Equity Tax policy
    const res = policyEngine.enactPolicy('pol_tax_progressive', worldState, { tick: 10 });
    assert.strictEqual(res.success, true);
    assert.strictEqual(worldState.economy.taxRate, 0.18, 'Tax rate should be updated by policy');
    assert.strictEqual(policyEngine.activePolicies.has('pol_tax_progressive'), true);
  });

  it('records every policy change in policyHistory and WorldState events', () => {
    const policyEngine = new PolicyEngine({ activePolicies: [] });
    const worldState = new WorldState();

    policyEngine.enactPolicy('pol_infra_transit', worldState, { tick: 5, rationale: 'Boost grid throughput' });
    assert.strictEqual(policyEngine.policyHistory.length, 1);
    assert.strictEqual(policyEngine.policyHistory[0].action, 'ENACT');
    assert.strictEqual(policyEngine.policyHistory[0].policyId, 'pol_infra_transit');

    // Repeal policy
    policyEngine.repealPolicy('pol_infra_transit', worldState, { tick: 15 });
    assert.strictEqual(policyEngine.policyHistory.length, 2);
    assert.strictEqual(policyEngine.policyHistory[1].action, 'REPEAL');
    assert.strictEqual(policyEngine.activePolicies.has('pol_infra_transit'), false);

    // Verify WorldState event logged
    const logged = worldState.events.log.find((e) => e.type === 'POLICY_REPEALED');
    assert.ok(logged, 'WorldState event log should record policy change event');
  });

  it('computes aggregate modifiers for productivity, health, and budget expenses', () => {
    const policyEngine = new PolicyEngine({
      activePolicies: ['pol_infra_transit', 'pol_health_universal'],
    });

    const { totalCostPerTick, modifiers } = policyEngine.getAggregateModifiers();
    assert.ok(totalCostPerTick > 0, 'Policies should incur continuous budget costs');
    assert.ok(modifiers.productivityMultiplier > 1.0, 'Infrastructure policy should raise productivity');
    assert.ok(modifiers.healthDelta > 0, 'Healthcare policy should increase health');
  });
});

describe('Phase 10: PublicServiceEngine', () => {
  it('manages healthcare, education, transit, and emergency allocations', () => {
    const engine = new PublicServiceEngine();
    assert.ok(engine.services.healthcare);
    assert.ok(engine.services.education);
    assert.ok(engine.services.infrastructure);
    assert.ok(engine.services.emergency);
    assert.ok(engine.services.resources);

    engine.setAllocation('healthcare', 120);
    assert.strictEqual(engine.services.healthcare.allocation, 120);
    assert.ok(engine.getTotalBudgetExpenditure() > 0);
  });

  it('evaluates service fulfillment and improves citizen vitals with adequate funding', () => {
    const engine = new PublicServiceEngine();
    const worldState = new WorldState();
    worldState.population.health = 70;

    engine.setAllocation('healthcare', 150);
    engine.update(worldState, 1.0, { healthDelta: 5 });

    assert.ok(worldState.population.health > 70, 'Funded healthcare should elevate citizen health');
    assert.ok(engine.getOverallSatisfaction() > 50, 'Public service satisfaction should be positive');
  });
});

describe('Phase 10: GovernmentEngine Integration', () => {
  it('updates treasury deductions, public services, and civic approval score', () => {
    const gov = new GovernmentEngine();
    const worldState = new WorldState();
    const random = new RandomEngine(42);
    worldState.economy.treasury = 50000;

    gov.update(worldState, 1.0, random, { tick: 1 });

    assert.ok(worldState.economy.treasury < 50000, 'Government expenses should deduct from treasury');
    assert.ok(worldState.metrics.government, 'WorldState metrics should contain government data');
    assert.ok(worldState.metrics.government.civicApprovalScore >= 10 && worldState.metrics.government.civicApprovalScore <= 100);
    assert.ok(worldState.metrics.government.publicServices.length >= 5);
  });

  it('runs seamlessly inside SimulationEngine tick pipeline', () => {
    const sim = new SimulationEngine({ seed: 777 });
    sim.init();

    // Step 5 ticks
    for (let i = 0; i < 5; i++) {
      sim.step(1.0);
    }

    const state = sim.stateManager.getCurrentState();
    assert.ok(state.metrics.government, 'Government metrics must be populated in simulation state');
    assert.ok(state.metrics.government.civicApprovalScore > 0);
    assert.ok(state.metrics.government.totalExpensesPerTick > 0);
  });
});
