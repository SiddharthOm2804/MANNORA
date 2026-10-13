import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  SimulationEngine,
  WorldState,
  RandomEngine,
  BuildingSystem,
  AgentEngine,
  Agent,
  NeedsSystem,
  GoalSystem,
  DecisionEngine,
  MemorySystem,
} from '../src/index.js';

describe('Phase 5: Multi-Agent Citizen System', () => {

  describe('1. NeedsSystem', () => {
    test('initializes with bounded default drives', () => {
      const needs = new NeedsSystem({ hunger: 15, rest: 85, social: 60, safety: 90, fulfillment: 50, health: 100 });
      assert.equal(needs.hunger, 15);
      assert.equal(needs.rest, 85);
      assert.equal(needs.social, 60);
      assert.equal(needs.safety, 90);
      assert.equal(needs.fulfillment, 50);
      assert.equal(needs.health, 100);
    });

    test('decays needs differently when awake vs sleeping', () => {
      const awakeNeeds = new NeedsSystem({ hunger: 10, rest: 80, social: 70, fulfillment: 60 });
      awakeNeeds.decay(1.0, false);
      assert.ok(awakeNeeds.hunger > 10, 'Hunger should increase while awake');
      assert.ok(awakeNeeds.rest < 80, 'Rest should decrease while awake');
      assert.ok(awakeNeeds.social < 70, 'Social should decay while awake');

      const sleepNeeds = new NeedsSystem({ hunger: 10, rest: 40, health: 90 });
      sleepNeeds.decay(1.0, true);
      assert.ok(sleepNeeds.rest > 40, 'Rest should recover during sleep');
      assert.ok(sleepNeeds.hunger > 10 && sleepNeeds.hunger < awakeNeeds.hunger, 'Hunger increases more slowly during sleep');
      assert.ok(sleepNeeds.health > 90, 'Health recovers during restful sleep');
    });

    test('flags urgent needs and critical threshold triggers', () => {
      const needs = new NeedsSystem({ hunger: 80, rest: 15, health: 35 });
      const urgent = needs.getUrgentNeeds();
      assert.ok(urgent.length >= 3);

      const hungerUrgent = urgent.find(u => u.need === 'hunger');
      const restUrgent = urgent.find(u => u.need === 'rest');
      const healthUrgent = urgent.find(u => u.need === 'health');

      assert.ok(hungerUrgent && hungerUrgent.isCritical, 'Hunger >= 75 should be critical');
      assert.ok(restUrgent && restUrgent.isCritical, 'Rest <= 20 should be critical');
      assert.ok(healthUrgent && healthUrgent.isCritical, 'Health <= 40 should be critical');
    });

    test('satisfies needs and correctly clamps values within [0, 100]', () => {
      const needs = new NeedsSystem({ hunger: 70, rest: 30, social: 20 });
      needs.satisfy('hunger', 50);
      assert.equal(needs.hunger, 20);

      needs.satisfy('rest', 90);
      assert.equal(needs.rest, 100, 'Rest should clamp at 100');

      needs.satisfy('social', 50);
      assert.equal(needs.social, 70);
    });

    test('serializes and deserializes accurately', () => {
      const original = new NeedsSystem({ hunger: 33, rest: 66, social: 77, safety: 88, fulfillment: 44, health: 99 });
      const serialized = original.serialize();
      const restored = NeedsSystem.deserialize(serialized);

      assert.deepEqual(restored.serialize(), original.serialize());
      assert.equal(restored.getOverallWellbeing(), original.getOverallWellbeing());
    });
  });

  describe('2. GoalSystem', () => {
    test('activates survival goals when hunger or exhaustion is critical', () => {
      const goals = new GoalSystem();
      const hungryAgent = new Agent({
        id: 'agt_hungry',
        needs: { hunger: 85, rest: 80 },
        inventory: { food: 0 },
      });

      const active = goals.evaluate(hungryAgent, { nearestMarket: { id: 'mkt_1', coordinates: { x: 50, y: 50 } } });
      assert.equal(active.type, 'SURVIVE_HUNGER');
      assert.equal(active.category, 'survival');
      assert.equal(active.priority, 95);

      const exhaustedAgent = new Agent({
        id: 'agt_tired',
        needs: { hunger: 20, rest: 10 },
        residenceId: 'res_1',
      });
      const tiredGoal = goals.evaluate(exhaustedAgent, { residenceCoordinates: { x: 10, y: 10 } });
      assert.equal(tiredGoal.type, 'SURVIVE_EXHAUSTION');
      assert.equal(tiredGoal.priority, 90);
    });

    test('activates work shift during business hours for employed citizen', () => {
      const goals = new GoalSystem();
      const worker = new Agent({
        id: 'agt_worker',
        employerId: 'bld_factory',
        occupation: 'technician',
        needs: { hunger: 15, rest: 85 },
      });

      const active = goals.evaluate(worker, { workplaceCoordinates: { x: 30, y: 30 } }, { hour: 10 });
      assert.equal(active.type, 'WORK_SHIFT');
      assert.equal(active.category, 'economic');
    });

    test('activates entrepreneurship goal for ambitious and wealthy citizen', () => {
      const goals = new GoalSystem();
      const entrepreneur = new Agent({
        id: 'agt_boss',
        occupation: 'unemployed',
        wealth: 1200,
        personalityTraits: { ambition: 0.85 },
        needs: { hunger: 10, rest: 90 },
      });

      const active = goals.evaluate(
        entrepreneur,
        { availableCommercialLots: [{ x: 45, y: 45 }] },
        { hour: 14 }
      );
      assert.equal(active.type, 'START_BUSINESS');
      assert.equal(active.priority, 80);
    });

    test('advances progress and archives completed goals to history', () => {
      const goals = new GoalSystem();
      const agent = new Agent({ id: 'agt_prog', needs: { hunger: 10, rest: 90 } });
      goals.evaluate(agent, {}, { hour: 14 });

      assert.ok(goals.getActiveGoal());
      const max = goals.getActiveGoal().maxProgress;
      const completed = goals.advanceProgress(max);
      assert.equal(completed, true);
      assert.equal(goals.getActiveGoal(), null);
      assert.equal(goals.getGoalHistory().length, 1);
      assert.equal(goals.getGoalHistory()[0].status, 'completed');
    });
  });

  describe('3. MemorySystem', () => {
    test('records actions, perceptions, and computes deterministic importance', () => {
      const mem = new MemorySystem({ maxWorking: 10, maxEpisodic: 10 });
      
      const actionRecord = mem.record({
        tick: 5,
        type: 'action',
        description: 'Worked shift at Solar Array',
      });
      assert.ok(actionRecord.id);
      assert.equal(actionRecord.tick, 5);
      assert.ok(actionRecord.importance >= 0.3 && actionRecord.importance <= 0.6);

      const milestoneRecord = mem.record({
        tick: 10,
        type: 'milestone',
        description: 'Founded new commercial venture',
        emotionalValence: 0.9,
      });
      assert.ok(milestoneRecord.importance >= 0.85);
      assert.equal(mem.getEpisodicMemories().length, 1, 'Milestone must consolidate into episodic memory');
    });

    test('culls short-term working memory at capacity', () => {
      const mem = new MemorySystem({ maxWorking: 3 });
      mem.record({ description: 'Event 1' });
      mem.record({ description: 'Event 2' });
      mem.record({ description: 'Event 3' });
      mem.record({ description: 'Event 4' });

      assert.equal(mem.getRecentMemories(10).length, 3);
      assert.equal(mem.getRecentMemories(10)[0].description, 'Event 4');
    });

    test('queries memories by related agent and event type', () => {
      const mem = new MemorySystem();
      mem.record({ type: 'interaction', description: 'Chat with Kaelen', relatedAgentId: 'agt_kaelen' });
      mem.record({ type: 'action', description: 'Bought lunch' });
      mem.record({ type: 'interaction', description: 'Negotiated trade with Kaelen', relatedAgentId: 'agt_kaelen' });

      const kaelenMemories = mem.getMemoriesWithAgent('agt_kaelen');
      assert.equal(kaelenMemories.length, 2);

      const interactionMemories = mem.getMemoriesByType('interaction');
      assert.equal(interactionMemories.length, 2);
    });
  });

  describe('4. DecisionEngine', () => {
    test('enforces purposeful travel when target destination is distant (no random wandering)', () => {
      const engine = new DecisionEngine();
      const citizen = new Agent({
        id: 'agt_walker',
        location: { x: 10, y: 10 },
        employerId: 'bld_work',
        occupation: 'engineer',
        needs: { hunger: 10, rest: 90 },
      });

      const observations = {
        isWorkHours: true,
        workplaceCoordinates: { x: 50, y: 50 },
      };

      const decision = engine.selectAction(citizen, observations);
      assert.equal(decision.type, 'travel');
      assert.equal(decision.target.x, 50);
      assert.equal(decision.target.y, 50);
      assert.ok(decision.reason.includes('Commuting to workplace'));
    });

    test('decides to work when arrived at workplace during work hours', () => {
      const engine = new DecisionEngine();
      const worker = new Agent({
        id: 'agt_at_work',
        location: { x: 50, y: 50 },
        employerId: 'bld_work',
        occupation: 'engineer',
        income: 35,
        needs: { hunger: 10, rest: 80 },
      });

      const observations = {
        isWorkHours: true,
        workplaceCoordinates: { x: 50, y: 50 }, // Already at site
      };

      const decision = engine.selectAction(worker, observations);
      assert.equal(decision.type, 'work');
      assert.equal(decision.payload.wage, 35);
    });

    test('decides to eat immediately if food is in personal inventory', () => {
      const engine = new DecisionEngine();
      const hungry = new Agent({
        id: 'agt_snack',
        needs: { hunger: 75, rest: 80 },
        inventory: { food: 2 },
      });

      const decision = engine.selectAction(hungry, {});
      assert.equal(decision.type, 'eat');
      assert.equal(decision.payload.source, 'inventory');
    });

    test('decides to sleep when exhausted or during night at residence', () => {
      const engine = new DecisionEngine();
      const sleepy = new Agent({
        id: 'agt_sleepy',
        location: { x: 20, y: 20 },
        residenceId: 'res_home',
        needs: { hunger: 10, rest: 15 },
      });

      const decision = engine.selectAction(sleepy, {
        isNight: true,
        residenceCoordinates: { x: 20, y: 20 },
      });
      assert.equal(decision.type, 'sleep');
    });

    test('decides to save money when wealthy and frugal', () => {
      const engine = new DecisionEngine();
      const investor = new Agent({
        id: 'agt_frugal',
        location: { x: 20, y: 20 },
        residenceId: 'res_home',
        wealth: 800,
        personalityTraits: { frugality: 0.8 },
        needs: { hunger: 10, rest: 80, fulfillment: 70 },
      });

      const decision = engine.selectAction(investor, {
        isNight: false,
        isWorkHours: false,
        residenceCoordinates: { x: 20, y: 20 },
      });
      assert.equal(decision.type, 'save_money');
    });
  });

  describe('5. Agent Full Lifecycle & World Mutation', () => {
    test('instantiates with all required citizen attributes', () => {
      const citizen = new Agent({
        id: 'agt_full_1',
        name: 'Elena Rostova',
        age: 29,
        occupation: 'scientist',
        income: 42,
        wealth: 350,
        skills: { science: 0.85, engineering: 0.60 },
        needs: { hunger: 12, rest: 88, social: 75 },
        healthState: { health: 100, energy: 95, happiness: 90 },
        location: { x: 45, y: 60, sector: 'Sector-02 // Research Matrix' },
        personalityTraits: { rationality: 0.9, ambition: 0.8, socialAffinity: 0.6 },
      });

      assert.equal(citizen.id, 'agt_full_1');
      assert.equal(citizen.name, 'Elena Rostova');
      assert.equal(citizen.age, 29);
      assert.equal(citizen.occupation, 'scientist');
      assert.equal(citizen.income, 42);
      assert.equal(citizen.wealth, 350);
      assert.equal(citizen.skills.science, 0.85);
      assert.ok(citizen.needs instanceof NeedsSystem);
      assert.ok(citizen.goals instanceof GoalSystem);
      assert.ok(citizen.memory instanceof MemorySystem);
      assert.equal(citizen.healthState.health, 100);
      assert.equal(citizen.location.x, 45);
      assert.equal(citizen.personalityTraits.rationality, 0.9);
      assert.ok(citizen.relationships instanceof Map);
    });

    test('work action earns net wage, pays municipal taxes, and drains energy', () => {
      const worldState = new WorldState({
        economy: { treasury: 10000, taxRate: 0.20 },
      });
      const employer = BuildingSystem.createBuilding('bld_lab', 'research_lab', { coordinates: { x: 50, y: 50 } });
      worldState.addBuilding(employer);

      const agent = new Agent({
        id: 'agt_sci',
        location: { x: 50, y: 50 },
        employerId: 'bld_lab',
        occupation: 'scientist',
        income: 50,
        wealth: 100,
        personalityTraits: { productivity: 0.8 },
      });

      const initialRest = agent.needs.rest;
      const initialTreasury = worldState.economy.treasury;

      agent.step(worldState, null, 1.0, null, { hour: 10, tick: 1 });

      assert.ok(agent.wealth > 100, 'Wealth should increase from earnings');
      assert.ok(worldState.economy.treasury > initialTreasury, 'Treasury should receive tax income');
      assert.ok(agent.needs.rest < initialRest, 'Work should expend energy/rest');
      assert.equal(agent.healthState.currentAction, 'WORK');
      assert.ok(agent.memory.getRecentMemories().length > 0, 'Memory should be updated after action');
    });

    test('purposeful travel moves agent along vector and arrives at destination', () => {
      const worldState = new WorldState();
      const residence = BuildingSystem.createBuilding('res_1', 'residential', { coordinates: { x: 20, y: 20 } });
      worldState.addBuilding(residence);

      const agent = new Agent({
        id: 'agt_traveler',
        location: { x: 20, y: 20 },
        employerId: 'work_1',
        occupation: 'engineer',
      });
      const workplace = BuildingSystem.createBuilding('work_1', 'power_plant', { coordinates: { x: 28, y: 20 } });
      worldState.addBuilding(workplace);

      // Purposeful steps: commence commute and arrive at destination
      for (let t = 1; t <= 4; t++) {
        agent.step(worldState, null, 1.0, null, { hour: 9, tick: t });
      }
      assert.equal(agent.location.x, 28);
      assert.equal(agent.location.y, 20);
      assert.equal(agent.location.buildingId, 'work_1');
    });

    test('interact action builds mutual relationships and restores social drive', () => {
      const worldState = new WorldState();
      const engine = new AgentEngine();

      const alice = new Agent({
        id: 'agt_alice',
        name: 'Alice',
        location: { x: 50, y: 50 },
        needs: { social: 25 },
        personalityTraits: { socialAffinity: 0.8, rationality: 0.7 },
      });

      const bob = new Agent({
        id: 'agt_bob',
        name: 'Bob',
        location: { x: 51, y: 50 },
        needs: { social: 30 },
        personalityTraits: { socialAffinity: 0.75, rationality: 0.65 },
      });

      engine.registerAgent(alice);
      engine.registerAgent(bob);

      alice.step(worldState, engine, 1.0, null, { hour: 19, tick: 1 });

      assert.ok(alice.needs.social > 25, 'Alice social drive should recover');
      assert.ok(bob.needs.social > 30, 'Bob social drive should recover mutually');
      assert.ok(alice.relationships.has('agt_bob'), 'Alice should have relationship record for Bob');
      assert.ok(bob.relationships.has('agt_alice'), 'Bob should have relationship record for Alice');
    });

    test('start_business constructs new commercial building in WorldState', () => {
      const worldState = new WorldState();
      const entrepreneur = new Agent({
        id: 'agt_founder',
        name: 'Marcus Thorne',
        occupation: 'unemployed',
        wealth: 1000,
        location: { x: 60, y: 60 },
        personalityTraits: { ambition: 0.9, riskTolerance: 0.8 },
        needs: { hunger: 10, rest: 90 },
      });

      const initialBuildingCount = worldState.getBuildingCount();

      // Purposeful steps to travel to development lot and found venture
      for (let t = 1; t <= 8 && !entrepreneur.businessId; t++) {
        entrepreneur.step(worldState, null, 1.0, null, { hour: 14, tick: t });
      }

      assert.ok(entrepreneur.wealth < 1000, 'Capital should be deducted for business foundation');
      assert.equal(worldState.getBuildingCount(), initialBuildingCount + 1, 'New building should exist in world');
      assert.equal(entrepreneur.occupation, 'entrepreneur');
      assert.ok(entrepreneur.businessId);
    });
  });

  describe('6. AgentEngine Population Coordination', () => {
    test('creates citizens and populates world cleanly', () => {
      const worldState = new WorldState();
      worldState.addBuilding(BuildingSystem.createBuilding('res_block', 'residential', { coordinates: { x: 25, y: 25 } }));
      worldState.addBuilding(BuildingSystem.createBuilding('work_hub', 'commercial', { coordinates: { x: 75, y: 75 } }));

      const agentEngine = new AgentEngine();
      const random = new RandomEngine(98765);
      const citizens = agentEngine.populateWorld(worldState, 12, random);

      assert.equal(citizens.length, 12);
      assert.equal(agentEngine.getAllAgents().length, 12);
      assert.equal(worldState.getAgentCount(), 12);

      for (const citizen of citizens) {
        assert.ok(citizen.id);
        assert.ok(citizen.name);
        assert.ok(citizen.age >= 18);
        assert.ok(citizen.needs);
        assert.ok(citizen.goals);
        assert.ok(citizen.memory);
      }
    });

    test('spatial query returns nearby agents within radius', () => {
      const engine = new AgentEngine();
      const a1 = new Agent({ id: 'a1', location: { x: 50, y: 50 } });
      const a2 = new Agent({ id: 'a2', location: { x: 53, y: 54 } }); // dist = 5
      const a3 = new Agent({ id: 'a3', location: { x: 90, y: 90 } }); // dist = ~56

      engine.registerAgent(a1);
      engine.registerAgent(a2);
      engine.registerAgent(a3);

      const nearby = engine.getNearbyAgents(50, 50, 10, 'a1');
      assert.equal(nearby.length, 1);
      assert.equal(nearby[0].id, 'a2');
    });

    test('deterministic simulation execution across identical seeds', () => {
      const runSim = (seed) => {
        const engine = new SimulationEngine({ seed, tickRate: 10, useDefaultSystems: true });
        engine.init();

        const resBld = BuildingSystem.createBuilding('res_1', 'residential', { coordinates: { x: 30, y: 30 } });
        const workBld = BuildingSystem.createBuilding('work_1', 'commercial', { coordinates: { x: 70, y: 70 } });
        engine.stateManager.getCurrentState().addBuilding(resBld);
        engine.stateManager.getCurrentState().addBuilding(workBld);

        engine.agentEngine.populateWorld(engine.stateManager.getCurrentState(), 8, engine.random);

        // Run 15 simulation ticks
        for (let i = 0; i < 15; i++) {
          engine.step();
        }

        return engine.stateManager.getCurrentState().serialize();
      };

      const run1 = runSim(445566);
      const run2 = runSim(445566);

      // Deep compare final world states
      assert.deepEqual(run1.metrics, run2.metrics);
      assert.deepEqual(run1.population, run2.population);
      assert.deepEqual(run1.economy, run2.economy);
      assert.deepEqual(Object.keys(run1.agents), Object.keys(run2.agents));
      assert.deepEqual(run1.agents['agt_001'], run2.agents['agt_001']);
    });
  });
});
