import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  SimulationEngine,
  WorldState,
  RandomEngine,
  BuildingSystem,
  AgentEngine,
  Agent,
  EconomyEngine,
  MarketEngine,
  JobSystem,
  FinanceSystem,
  EconomySystem,
  ResourceSystem,
} from '../src/index.js';

describe('Phase 6: Civilization Economy System', () => {

  describe('1. MarketEngine & Dynamic Commodity Pricing', () => {
    test('initializes with default base prices and price elasticities', () => {
      const market = new MarketEngine();
      assert.equal(market.basePrices.energy, 1.0);
      assert.equal(market.basePrices.agriculture, 1.5);
      assert.equal(market.basePrices.minerals, 2.5);
      assert.ok(market.elasticity.agriculture < market.elasticity.technology, 'Necessities should be less elastic than tech');
    });

    test('increases prices when supply decreases / resource scarcity occurs', () => {
      const market = new MarketEngine();
      const worldState = new WorldState({
        resources: {
          agriculture: { current: 500, max: 15000, production: 5, consumption: 25 }, // severe shortage (<4% buffer)
        },
        economy: {
          marketPrices: { agriculture: 1.50 },
        },
      });

      const updated = market.updatePrices(worldState);
      assert.ok(
        updated.agriculture > 1.50,
        `Expected agriculture price to increase due to scarcity, got ${updated.agriculture}`
      );
    });

    test('decreases prices when resource surplus occurs', () => {
      const market = new MarketEngine();
      const worldState = new WorldState({
        resources: {
          energy: { current: 19000, max: 20000, production: 50, consumption: 10 }, // huge surplus (95% buffer)
        },
        economy: {
          marketPrices: { energy: 1.00 },
        },
      });

      const updated = market.updatePrices(worldState);
      assert.ok(
        updated.energy < 1.00,
        `Expected energy price to decrease during surplus, got ${updated.energy}`
      );
    });

    test('calculates accurate transaction costs', () => {
      const market = new MarketEngine();
      const cost = market.calculateCost('agriculture', 5, { agriculture: 2.40 });
      assert.equal(cost, 12.0);
    });
  });

  describe('2. JobSystem, Employment & Salaries', () => {
    test('matches citizen with suitable building vacancy based on skill and distance', () => {
      const jobs = new JobSystem();
      const worldState = new WorldState();
      
      const researchLab = BuildingSystem.createBuilding('bld_lab_01', 'research_lab', {
        coordinates: { x: 50, y: 50 },
        capacity: 20,
        workers: 5,
      });
      worldState.addBuilding(researchLab);

      const scientistAgent = new Agent({
        id: 'agt_marie',
        location: { x: 52, y: 50 },
        skills: { science: 0.95 },
      });

      const match = jobs.matchJob(scientistAgent, worldState);
      assert.ok(match);
      assert.equal(match.buildingId, 'bld_lab_01');
      assert.equal(match.occupation, 'scientist');
      assert.ok(match.salary >= jobs.salaryBenchmarks.scientist);
    });

    test('calculates tailored salary factoring in productivity trait and skills', () => {
      const jobs = new JobSystem();
      const baseWage = jobs.salaryBenchmarks.engineer; // 38
      const highSkillWage = jobs.calculateSalary('engineer', { engineering: 0.95 }, { productivity: 0.9 });
      const entrySkillWage = jobs.calculateSalary('engineer', { engineering: 0.20 }, { productivity: 0.4 });

      assert.ok(highSkillWage > baseWage);
      assert.ok(entrySkillWage < baseWage);
    });

    test('computes job market telemetry and unemployment rate', () => {
      const jobs = new JobSystem();
      const worldState = new WorldState({
        population: { total: 1000, demographics: { working: 650 } },
      });
      worldState.addBuilding(BuildingSystem.createBuilding('work_1', 'industrial', { capacity: 600, workers: 500 }));

      const telemetry = jobs.getJobMarketTelemetry(worldState);
      assert.equal(telemetry.totalJobs, 600);
      assert.equal(telemetry.occupiedJobs, 500);
      assert.equal(telemetry.vacancies, 100);
      assert.ok(telemetry.unemploymentRate > 0 && telemetry.unemploymentRate < 0.35);
    });
  });

  describe('3. FinanceSystem & Business Accounting', () => {
    test('processes income taxes correctly', () => {
      const finance = new FinanceSystem({ baseTaxRate: 0.15 });
      const { netIncome, taxPaid } = finance.processTax(100, 0.20);
      assert.equal(taxPaid, 20.0);
      assert.equal(netIncome, 80.0);
    });

    test('accrues interest on citizen savings', () => {
      const finance = new FinanceSystem({ savingsInterestRate: 0.005 });
      const interest = finance.accrueInterest(1000);
      assert.equal(interest, 5.0);
    });

    test('calculates business balance and profit after wages and maintenance', () => {
      const finance = new FinanceSystem();
      const balance = finance.calculateBusinessBalance(
        { id: 'biz_01' },
        500, // Revenue
        200, // Wages
        50,  // Maintenance
        0.15 // Tax rate
      );

      assert.equal(balance.costs, 250);
      assert.equal(balance.profit, 250);
      assert.equal(balance.taxPaid, 37.5);
      assert.equal(balance.netProfit, 212.5);
    });

    test('calculates fiscal health score accurately', () => {
      const finance = new FinanceSystem();
      const healthy = finance.calculateFiscalHealth(60000, 5000, 3000);
      const distressed = finance.calculateFiscalHealth(200, 1000, 4000);

      assert.ok(healthy > 75, `Expected healthy score > 75, got ${healthy}`);
      assert.ok(distressed < 40, `Expected distressed score < 40, got ${distressed}`);
    });
  });

  describe('4. EconomyEngine End-to-End Civilization Economy', () => {
    test('executes complete economic cycle and computes all required Phase 6 metrics', () => {
      const engine = new EconomyEngine();
      const worldState = new WorldState({
        population: { total: 1000 },
        economy: { treasury: 25000, taxRate: 0.15 },
      });

      worldState.addBuilding(BuildingSystem.createBuilding('comm_hub', 'commercial', { capacity: 50, workers: 40 }));
      worldState.addBuilding(BuildingSystem.createBuilding('synth_plant', 'industrial', { capacity: 60, workers: 50 }));

      // Step economy
      engine.update(worldState, 1.0, new RandomEngine(123), { tick: 1 });

      const metrics = engine.getEconomicMetrics();
      assert.ok(metrics, 'Economic metrics must be returned');

      // Verify all required Phase 6 metrics exist
      assert.ok(metrics.gdp > 0, 'GDP metric must be calculated');
      assert.ok(metrics.unemployment !== undefined, 'Unemployment must be defined');
      assert.ok(metrics.averageIncome > 0, 'Average income must be defined');
      assert.ok(metrics.averageWealth > 0, 'Average wealth must be defined');
      assert.ok(metrics.inflation !== undefined, 'Inflation must be defined');
      assert.ok(metrics.resourceAvailability > 0, 'Resource availability must be calculated');
      assert.equal(metrics.businessCount, 2, 'Business count should reflect commercial/industrial buildings');
      assert.ok(metrics.businessStats.totalRevenue > 0, 'Business revenue should be calculated');
      assert.ok(metrics.businessStats.totalProfit !== undefined, 'Business profit must be tracked');

      // Verify metrics synchronized to worldState
      assert.equal(worldState.metrics.gdp, metrics.gdp);
      assert.equal(worldState.metrics.unemployment, metrics.unemployment);
      assert.equal(worldState.metrics.businessCount, 2);
    });

    test('demonstrates causal chain: resource shortage -> price increase -> citizen spending & business adjustments', () => {
      const sim = new SimulationEngine({ seed: 778899, useDefaultSystems: true });
      sim.init();

      const state = sim.stateManager.getCurrentState();
      
      // Populate with market and residential buildings
      state.addBuilding(BuildingSystem.createBuilding('food_market', 'commercial', {
        coordinates: { x: 50, y: 50 },
        capacity: 40,
        workers: 30,
      }));

      // Induce severe agricultural food shortage
      state.resources.agriculture.current = 50;
      state.resources.agriculture.production = 1;
      state.resources.agriculture.consumption = 30; // heavy net deficit
      const initialFoodPrice = state.economy.marketPrices.agriculture;

      // Run simulation steps
      for (let t = 0; t < 5; t++) {
        sim.step();
      }

      const finalState = sim.stateManager.getCurrentState();
      const updatedFoodPrice = finalState.economy.marketPrices.agriculture;

      // Verify price surged
      assert.ok(
        updatedFoodPrice > initialFoodPrice,
        `Expected food price to rise due to shortage. Initial: ${initialFoodPrice}, Final: ${updatedFoodPrice}`
      );

      // Verify inflation rate adjusted upward
      assert.ok(finalState.economy.inflationRate > 0.01);
    });
  });
});
