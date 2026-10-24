import { RelationshipEngine } from './RelationshipEngine.js';
import { CommunityEngine } from './CommunityEngine.js';

/**
 * SocialDynamics integrates interpersonal networks and community affiliations
 * to compute macro- and micro-level social effects across NEURAL CITY:
 *
 * 1. Social Influence on Decisions & Goal Prioritization
 * 2. Emotional Contagion & Collective Happiness
 * 3. Cooperation & Mutual Aid (financial support during distress)
 * 4. Information & Rumor Spread (market awareness, event awareness)
 * 5. Social Metrics Computation (Network Density, Social Capital, Cohesion, Harmony Index)
 */
export class SocialDynamics {
  /**
   * @param {Object} [config]
   */
  constructor(config = {}) {
    this.relationshipEngine = config.relationshipEngine || new RelationshipEngine();
    this.communityEngine = config.communityEngine || new CommunityEngine();

    /**
     * Active circulating news / information items
     * Array<{ id, content, sentiment, originAgentId, tick, reach: Set<string> }>
     */
    this.circulatingNews = [];
  }

  /**
   * Pipeline step: updates social graph, community dynamics, and socio-cultural metrics.
   *
   * @param {import('../core/WorldState.js').WorldState} worldState
   * @param {import('../agents/AgentEngine.js').AgentEngine} agentEngine
   * @param {number} delta
   * @param {import('../core/RandomEngine.js').RandomEngine} random
   * @param {Object} [clockInfo={}]
   */
  update(worldState, agentEngine, delta, random, clockInfo = {}) {
    const agents = agentEngine.getAllAgents();
    if (agents.length === 0) return;

    const tick = clockInfo.tick ?? 0;

    // 1. Initial Seeding if graph is empty
    if (this.relationshipEngine.socialGraph.size === 0) {
      this.relationshipEngine.seedInitialRelationships(agents, random);
    }

    // 2. Form or refresh community affiliations
    if (this.communityEngine.communities.size === 0 || tick % 48 === 0) {
      this.communityEngine.formCommunities(agents, this.relationshipEngine, tick);
    }

    // 3. Natural Relationship Decay check
    this.relationshipEngine.stepDecay(tick, 24);

    // 4. Update community cohesion metrics
    this.communityEngine.updateCommunityCohesion(this.relationshipEngine);

    // 5. Apply Mutual Aid & Cooperation (Safety Net)
    this.applyMutualAid(agents, worldState, tick);

    // 6. Apply Emotional Contagion across close social ties
    this.applyEmotionalContagion(agents);

    // 7. Disseminate Information / Rumors across social graph
    this.propagateInformation(agents, tick, random);

    // 8. Compute Civilization-Wide Social Metrics
    const socialMetrics = this.computeSocialMetrics(agents, worldState);

    // Commit metrics to WorldState
    worldState.metrics.social = socialMetrics;

    // Influence overall happiness slightly via social cohesion
    worldState.population.happiness = Math.max(
      0,
      Math.min(
        100,
        Math.round(worldState.population.happiness * 0.85 + socialMetrics.harmonyIndex * 0.15)
      )
    );
  }

  /**
   * 1. MUTUAL AID & COOPERATION
   * Citizens with high-strength relationships (family, confidants) or fellow community members
   * extend small financial emergency loans or grants to peers experiencing severe poverty or hunger.
   *
   * @param {import('../agents/Agent.js').Agent[]} agents
   * @param {import('../core/WorldState.js').WorldState} worldState
   * @param {number} tick
   */
  applyMutualAid(agents, worldState, tick) {
    for (const agent of agents) {
      // Check if agent is in financial distress (wealth < 20 and hunger > 50)
      if (agent.wealth < 20 && agent.needs.hunger > 50) {
        const ties = this.relationshipEngine.getCloseTies(agent.id, 0.45);
        for (const bond of ties) {
          const benefactor = agents.find((a) => a.id === bond.targetId);
          if (benefactor && benefactor.wealth > 150) {
            // Transfer emergency aid (15 credits)
            const aidAmount = 15;
            benefactor.wealth = Number((benefactor.wealth - aidAmount).toFixed(2));
            agent.wealth = Number((agent.wealth + aidAmount).toFixed(2));

            // Mutual satisfaction & trust elevation
            agent.needs.satisfy('safety', 20);
            agent.healthState.happiness = Math.min(100, agent.healthState.happiness + 6);
            benefactor.needs.satisfy('fulfillment', 15);

            this.relationshipEngine.recordInteraction(agent.id, benefactor.id, 8, 10, tick);

            agent.memory.record({
              tick,
              type: 'social',
              description: `Received emergency aid of ${aidAmount} credits from ${benefactor.name}`,
              importance: 0.7,
              emotionalValence: 0.8,
              relatedAgentId: benefactor.id,
            });

            benefactor.memory.record({
              tick,
              type: 'social',
              description: `Provided mutual aid to support ${agent.name} in crisis`,
              importance: 0.6,
              emotionalValence: 0.7,
              relatedAgentId: agent.id,
            });

            break; // One benefactor per tick
          }
        }
      }
    }
  }

  /**
   * 2. EMOTIONAL CONTAGION
   * Happiness and stress diffuse across close friends and family members.
   * If close ties are stressed or miserable, an agent's happiness is dampened;
   * if ties are jubilant, positive sentiment lifts the network.
   *
   * @param {import('../agents/Agent.js').Agent[]} agents
   */
  applyEmotionalContagion(agents) {
    const agentMap = new Map();
    for (const a of agents) {
      agentMap.set(a.id, a);
    }

    for (const agent of agents) {
      const closeTies = this.relationshipEngine.getCloseTies(agent.id, 0.5);
      if (closeTies.length === 0) continue;

      let sumNeighborHappiness = 0;
      let totalWeight = 0;

      for (const tie of closeTies) {
        const neighbor = agentMap.get(tie.targetId);
        if (neighbor) {
          const weight = tie.strength;
          sumNeighborHappiness += neighbor.healthState.happiness * weight;
          totalWeight += weight;
        }
      }

      if (totalWeight > 0) {
        const avgNeighborHappiness = sumNeighborHappiness / totalWeight;
        const happinessDelta = (avgNeighborHappiness - agent.healthState.happiness) * 0.05;
        agent.healthState.happiness = Math.max(
          0,
          Math.min(100, Number((agent.healthState.happiness + happinessDelta).toFixed(2)))
        );
      }
    }
  }

  /**
   * 3. INFORMATION & RUMOR SPREAD
   * News items circulate along social edges.
   * Agents share active news with neighbors during conversations.
   *
   * @param {import('../agents/Agent.js').Agent[]} agents
   * @param {number} tick
   * @param {import('../core/RandomEngine.js').RandomEngine} random
   */
  propagateInformation(agents, tick, random) {
    // Generate organic news items periodically (e.g. every 20 ticks)
    if (tick % 20 === 0 && agents.length > 0) {
      const origin = random ? random.choice(agents) : agents[0];
      const newsTopics = [
        { headline: 'Agricultural harvest yield expected to stabilize market prices', sentiment: 0.6 },
        { headline: 'Energy grid maintenance completed in the Industrial sector', sentiment: 0.4 },
        { headline: 'Civic Council deliberation on infrastructure subsidies underway', sentiment: 0.5 },
        { headline: 'Technological breakthrough reported by Applied Cybernetics Guild', sentiment: 0.8 },
      ];
      const selected = random ? random.choice(newsTopics) : newsTopics[0];

      this.circulatingNews.push({
        id: `news_${tick}_${origin.id}`,
        headline: selected.headline,
        sentiment: selected.sentiment,
        originAgentId: origin.id,
        createdAtTick: tick,
        reach: new Set([origin.id]),
      });

      // Keep news history tidy (max 10 items)
      if (this.circulatingNews.length > 10) {
        this.circulatingNews.shift();
      }
    }

    // Disseminate along social bonds
    for (const news of this.circulatingNews) {
      const informedAgents = Array.from(news.reach);
      for (const agentId of informedAgents) {
        const bonds = this.relationshipEngine.getAgentRelationships(agentId);
        for (const bond of bonds) {
          // Transmission probability scales with relationship strength
          const transmitChance = bond.strength * 0.6;
          const roll = random ? random.random() : 0.2;
          if (roll <= transmitChance && !news.reach.has(bond.targetId)) {
            news.reach.add(bond.targetId);
            const targetAgent = agents.find((a) => a.id === bond.targetId);
            if (targetAgent) {
              // Mild positive effect on fulfillment / awareness
              targetAgent.needs.satisfy('fulfillment', 2);
            }
          }
        }
      }
    }
  }

  /**
   * 4. COMPUTE CIVILIZATION-WIDE SOCIAL METRICS
   * Exposes structured KPIs to frontend:
   * - networkDensity: Edge connectedness ratio
   * - averageRelationshipStrength: Mean tie strength across all edges
   * - communityCohesion: Average cohesion of civic/guild/interest communities
   * - activeCommunitiesCount: Total registered communities
   * - harmonyIndex: Composite social health indicator [0 - 100]
   * - totalSocialTies: Total recorded relationships
   * - informationReachRate: Percentage of citizens reached by prevailing news
   *
   * @param {import('../agents/Agent.js').Agent[]} agents
   * @param {import('../core/WorldState.js').WorldState} worldState
   * @returns {Object}
   */
  computeSocialMetrics(agents, worldState) {
    const net = this.relationshipEngine.getNetworkRepresentation(agents);
    const communities = this.communityEngine.getAllCommunities();

    let totalCohesion = 0;
    for (const c of communities) {
      totalCohesion += c.cohesion;
    }
    const avgCohesion = communities.length > 0 ? Number((totalCohesion / communities.length).toFixed(3)) : 0.65;

    let totalStrength = 0;
    for (const edge of net.edges) {
      totalStrength += edge.strength;
    }
    const avgStrength = net.edges.length > 0 ? Number((totalStrength / net.edges.length).toFixed(3)) : 0.5;

    // Calculate information reach percentage
    let totalReachCount = 0;
    if (this.circulatingNews.length > 0) {
      const latestNews = this.circulatingNews[this.circulatingNews.length - 1];
      totalReachCount = latestNews.reach.size;
    }
    const infoReachPct = agents.length > 0 ? Number(((totalReachCount / agents.length) * 100).toFixed(1)) : 0;

    // Harmony Index: composite indicator of societal peace & trust
    const harmonyIndex = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          (avgStrength * 35) +
          (avgCohesion * 35) +
          ((1 - (worldState.metrics.crimeRate || 5) / 100) * 15) +
          (Math.min(1, net.density * 5) * 15)
        )
      )
    );

    return {
      networkDensity: net.density,
      averageDegree: net.avgDegree,
      averageRelationshipStrength: avgStrength,
      communityCohesion: avgCohesion,
      activeCommunitiesCount: communities.length,
      harmonyIndex,
      totalSocialTies: net.edgeCount,
      informationReachRate: infoReachPct,
      communitiesSummary: communities.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        membersCount: c.members.size,
        cohesion: c.cohesion,
        treasury: c.treasury,
      })),
      recentNews: this.circulatingNews.slice(-3).map((n) => ({
        headline: n.headline,
        sentiment: n.sentiment,
        reachCount: n.reach.size,
      })),
    };
  }
}

export default SocialDynamics;
