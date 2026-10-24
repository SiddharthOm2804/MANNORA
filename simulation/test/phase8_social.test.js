import { describe, it } from 'node:test';
import assert from 'node:assert';
import { RelationshipEngine } from '../src/society/RelationshipEngine.js';
import { CommunityEngine } from '../src/society/CommunityEngine.js';
import { SocialDynamics } from '../src/society/SocialDynamics.js';
import { AgentEngine } from '../src/agents/AgentEngine.js';
import { WorldState } from '../src/core/WorldState.js';
import { RandomEngine } from '../src/core/RandomEngine.js';

describe('Phase 8: RelationshipEngine', () => {
  it('creates directional and reciprocal bonds with normalized strength [0, 1]', () => {
    const engine = new RelationshipEngine();
    
    // Set reciprocal bond
    const { bondA, bondB } = engine.setReciprocalBond('agt_001', 'agt_002', {
      type: RelationshipEngine.TYPES.FRIENDSHIP,
      affinity: 70,
      trust: 60,
      interactionsCount: 10,
    });

    assert.ok(bondA, 'bondA should exist');
    assert.ok(bondB, 'bondB should exist');
    assert.strictEqual(bondA.type, 'friendship');
    assert.strictEqual(bondB.type, 'friendship');
    assert.ok(bondA.strength >= 0.0 && bondA.strength <= 1.0, 'Strength must be normalized [0, 1]');
    assert.ok(bondA.strength > 0.5, 'Bond with affinity 70 and trust 60 should have strength > 0.5');
  });

  it('supports family, workplace, friendship, and community relationship types', () => {
    const engine = new RelationshipEngine();

    const familyBond = engine.setBond('agt_001', 'agt_002', {
      type: RelationshipEngine.TYPES.FAMILY,
      role: RelationshipEngine.ROLES.SIBLING,
      affinity: 80,
      trust: 90,
    });

    const workBond = engine.setBond('agt_001', 'agt_003', {
      type: RelationshipEngine.TYPES.WORKPLACE,
      role: RelationshipEngine.ROLES.COLLEAGUE,
      affinity: 45,
      trust: 50,
    });

    assert.strictEqual(familyBond.type, 'family');
    assert.strictEqual(familyBond.role, 'sibling');
    assert.strictEqual(workBond.type, 'workplace');
    assert.strictEqual(workBond.role, 'colleague');
    assert.ok(familyBond.strength > workBond.strength, 'Family bond has baseline bonus');
  });

  it('records interaction history and dynamically elevates roles', () => {
    const engine = new RelationshipEngine();

    // Initial interaction
    engine.recordInteraction('agt_001', 'agt_002', 30, 20, 10);
    let bond = engine.getBond('agt_001', 'agt_002');
    assert.strictEqual(bond.interactionsCount, 1);

    // Repeated positive interactions elevate to confidant
    engine.recordInteraction('agt_001', 'agt_002', 40, 30, 20);
    bond = engine.getBond('agt_001', 'agt_002');
    assert.strictEqual(bond.role, 'confidant');
    assert.ok(bond.strength > 0.65);
  });

  it('seeds initial family and workplace ties from residence and workplace affiliations', () => {
    const random = new RandomEngine(42);
    const engine = new RelationshipEngine();

    const agents = [
      AgentEngine.createCitizen('agt_001', { residenceId: 'res_01', employerId: 'work_01', age: 35 }),
      AgentEngine.createCitizen('agt_002', { residenceId: 'res_01', employerId: 'work_02', age: 34 }), // Roommate / spouse
      AgentEngine.createCitizen('agt_003', { residenceId: 'res_02', employerId: 'work_01', age: 28 }), // Coworker with agt_001
    ];

    engine.seedInitialRelationships(agents, random);

    const domesticBond = engine.getBond('agt_001', 'agt_002');
    assert.ok(domesticBond, 'agt_001 and agt_002 share residence and should have family tie');
    assert.strictEqual(domesticBond.type, 'family');

    const colleagueBond = engine.getBond('agt_001', 'agt_003');
    assert.ok(colleagueBond, 'agt_001 and agt_003 share employer and should have workplace tie');
    assert.strictEqual(colleagueBond.type, 'workplace');
  });

  it('exports graph representation with nodes, edges, density, and degree', () => {
    const engine = new RelationshipEngine();
    engine.setReciprocalBond('agt_001', 'agt_002', { affinity: 60, trust: 60 });
    engine.setReciprocalBond('agt_002', 'agt_003', { affinity: 50, trust: 50 });

    const net = engine.getNetworkRepresentation([
      { id: 'agt_001', name: 'Agent 1' },
      { id: 'agt_002', name: 'Agent 2' },
      { id: 'agt_003', name: 'Agent 3' },
    ]);

    assert.strictEqual(net.nodeCount, 3);
    assert.strictEqual(net.edgeCount, 2);
    assert.ok(net.density > 0 && net.density <= 1);
    assert.ok(net.avgDegree > 0);
  });
});

describe('Phase 8: CommunityEngine', () => {
  it('creates communities across geographic, occupational, and interest lines', () => {
    const engine = new CommunityEngine();

    const comm = engine.createCommunity({
      id: 'comm_geo_core',
      name: 'Central Matrix District Union',
      type: CommunityEngine.TYPES.GEOGRAPHIC,
      members: ['agt_001', 'agt_002'],
      treasury: 1500,
    });

    assert.strictEqual(comm.id, 'comm_geo_core');
    assert.strictEqual(comm.type, 'geographic');
    assert.strictEqual(comm.members.size, 2);

    const userComms = engine.getAgentCommunities('agt_001');
    assert.strictEqual(userComms.length, 1);
    assert.strictEqual(userComms[0].id, 'comm_geo_core');
  });

  it('automatically detects and forms communities based on location, occupation, and traits', () => {
    const commEngine = new CommunityEngine();
    const relEngine = new RelationshipEngine();

    const agents = [
      AgentEngine.createCitizen('agt_001', { occupation: 'scientist', location: { sector: 'Sector-01' } }),
      AgentEngine.createCitizen('agt_002', { occupation: 'scientist', location: { sector: 'Sector-01' } }),
      AgentEngine.createCitizen('agt_003', { occupation: 'engineer', location: { sector: 'Sector-02' } }),
      AgentEngine.createCitizen('agt_004', { occupation: 'engineer', location: { sector: 'Sector-02' } }),
    ];

    commEngine.formCommunities(agents, relEngine, 0);

    const allComms = commEngine.getAllCommunities();
    assert.ok(allComms.length >= 2, 'Should form geographic and guild communities');

    const guildComm = allComms.find((c) => c.type === 'occupational');
    assert.ok(guildComm, 'Occupational guild should be formed');

    const geoComm = allComms.find((c) => c.type === 'geographic');
    assert.ok(geoComm, 'Geographic district association should be formed');
  });

  it('updates community cohesion dynamically from internal relationship strength', () => {
    const commEngine = new CommunityEngine();
    const relEngine = new RelationshipEngine();

    commEngine.createCommunity({
      id: 'comm_test',
      name: 'Cohesion Test Guild',
      members: ['agt_001', 'agt_002'],
    });

    // Establish strong tie between members
    relEngine.setReciprocalBond('agt_001', 'agt_002', { affinity: 90, trust: 90, interactionsCount: 20 });
    commEngine.updateCommunityCohesion(relEngine);

    const comm = commEngine.getCommunity('comm_test');
    assert.ok(comm.cohesion > 0.6, 'Strong internal ties must elevate community cohesion');
  });
});

describe('Phase 8: SocialDynamics & Civilization Integration', () => {
  it('applies mutual aid to support distressed citizens', () => {
    const random = new RandomEngine(99);
    const dynamics = new SocialDynamics();
    const worldState = new WorldState();

    const wealthyBenefactor = AgentEngine.createCitizen('agt_rich', {
      name: 'Benefactor Marcus',
      wealth: 500,
      needs: { fulfillment: 40 },
    });

    const impoverishedAgent = AgentEngine.createCitizen('agt_poor', {
      name: 'Distressed Citizen',
      wealth: 5,
      needs: { hunger: 85, safety: 20 },
      healthState: { happiness: 40 },
    });

    const agents = [wealthyBenefactor, impoverishedAgent];

    // Establish strong friendship tie
    dynamics.relationshipEngine.setReciprocalBond('agt_poor', 'agt_rich', {
      affinity: 80,
      trust: 80,
      type: RelationshipEngine.TYPES.FRIENDSHIP,
    });

    // Execute mutual aid step
    dynamics.applyMutualAid(agents, worldState, 15);

    assert.ok(impoverishedAgent.wealth > 5, 'Impoverished agent should receive emergency aid');
    assert.ok(wealthyBenefactor.wealth < 500, 'Benefactor should expend mutual aid funds');
    assert.ok(impoverishedAgent.healthState.happiness > 40, 'Happiness should rise from mutual aid');
  });

  it('propagates information across social edges without requiring LLM', () => {
    const random = new RandomEngine(101);
    const dynamics = new SocialDynamics();

    const agentA = AgentEngine.createCitizen('agt_01');
    const agentB = AgentEngine.createCitizen('agt_02');
    const agentC = AgentEngine.createCitizen('agt_03');
    const agents = [agentA, agentB, agentC];

    // Bond A to B strongly
    dynamics.relationshipEngine.setReciprocalBond('agt_01', 'agt_02', {
      affinity: 90,
      trust: 90,
      interactionsCount: 15,
    });

    // Trigger news propagation at tick 20
    dynamics.propagateInformation(agents, 20, random);

    assert.ok(dynamics.circulatingNews.length > 0, 'News should circulate');
    const news = dynamics.circulatingNews[0];
    assert.ok(news.reach.size >= 1, 'News must reach at least the origin agent');
  });

  it('computes comprehensive social metrics for frontend telemetry', () => {
    const dynamics = new SocialDynamics();
    const worldState = new WorldState();

    const agents = [
      AgentEngine.createCitizen('agt_01'),
      AgentEngine.createCitizen('agt_02'),
      AgentEngine.createCitizen('agt_03'),
    ];

    dynamics.relationshipEngine.setReciprocalBond('agt_01', 'agt_02', { affinity: 70, trust: 70 });
    dynamics.communityEngine.formCommunities(agents, dynamics.relationshipEngine, 0);

    const metrics = dynamics.computeSocialMetrics(agents, worldState);

    assert.ok(metrics.networkDensity >= 0, 'networkDensity should be computed');
    assert.ok(metrics.averageRelationshipStrength >= 0, 'averageRelationshipStrength should be computed');
    assert.ok(metrics.communityCohesion >= 0, 'communityCohesion should be computed');
    assert.ok(metrics.activeCommunitiesCount >= 1, 'activeCommunitiesCount should be >= 1');
    assert.ok(metrics.harmonyIndex >= 0 && metrics.harmonyIndex <= 100, 'harmonyIndex should be [0, 100]');
    assert.strictEqual(metrics.totalSocialTies, 1);
  });

  it('runs deterministically within AgentEngine multi-agent update loop', () => {
    const agentEngine = new AgentEngine();
    const worldState = new WorldState();
    const random = new RandomEngine(55);

    agentEngine.populateWorld(worldState, 6, random);
    
    // Step simulation
    agentEngine.update(worldState, 1.0, random, { tick: 1, hour: 10, day: 1 });

    assert.ok(worldState.metrics.social, 'worldState.metrics.social must be populated');
    assert.ok(worldState.metrics.social.harmonyIndex > 0, 'harmonyIndex should be computed');
    assert.ok(worldState.metrics.social.activeCommunitiesCount > 0, 'Communities should be active');
    assert.ok(worldState.metrics.social.totalSocialTies > 0, 'Social ties should be populated');
  });
});
