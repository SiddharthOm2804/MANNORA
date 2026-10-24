/**
 * RelationshipEngine manages the social graph and interpersonal bonds across citizens in NEURAL CITY.
 *
 * Supported relationship types:
 * - 'family' (parent, child, sibling, spouse)
 * - 'friendship' (acquaintance, friend, confidant, close_friend)
 * - 'workplace' (colleague, manager, subordinate, business_partner)
 * - 'community' (fellow member of guild, club, enclave)
 *
 * Relationship strength is modeled on a normalized scale [0.0, 1.0]
 * computed deterministically from affinity, trust, familiarity (interaction history), and compatibility.
 */
export class RelationshipEngine {
  /**
   * Relationship type categories
   */
  static TYPES = {
    FAMILY: 'family',
    FRIENDSHIP: 'friendship',
    WORKPLACE: 'workplace',
    COMMUNITY: 'community',
  };

  /**
   * Sub-classifications of relationships
   */
  static ROLES = {
    SPOUSE: 'spouse',
    SIBLING: 'sibling',
    PARENT: 'parent',
    CHILD: 'child',
    FRIEND: 'friend',
    CONFIDANT: 'confidant',
    COLLEAGUE: 'colleague',
    BUSINESS_PARTNER: 'business_partner',
    RIVAL: 'rival',
    ACQUAINTANCE: 'acquaintance',
    FELLOW_MEMBER: 'fellow_member',
  };

  constructor() {
    /**
     * Graph adjacency list representation:
     * Map<agentId, Map<targetAgentId, RelationshipBond>>
     * @type {Map<string, Map<string, Object>>}
     */
    this.socialGraph = new Map();
  }

  /**
   * Ensure node exists in social graph
   * @param {string} agentId
   */
  _ensureNode(agentId) {
    if (!this.socialGraph.has(agentId)) {
      this.socialGraph.set(agentId, new Map());
    }
  }

  /**
   * Calculate deterministic relationship strength [0.0, 1.0].
   * Weights: affinity (35%), trust (35%), familiarity (20%), reciprocity (10%).
   *
   * @param {number} affinity - Range [-100, 100]
   * @param {number} trust - Range [0, 100]
   * @param {number} interactionsCount
   * @param {string} type
   * @returns {number} Normalized strength [0.0, 1.0]
   */
  static calculateStrength(affinity, trust, interactionsCount = 0, type = 'friendship') {
    // Normalize affinity from [-100, 100] to [0, 1]
    const normAffinity = Math.max(0, Math.min(1, (affinity + 100) / 200));
    // Normalize trust [0, 100] to [0, 1]
    const normTrust = Math.max(0, Math.min(1, trust / 100));
    // Logarithmic saturation for interaction frequency
    const normFamiliarity = Math.min(1, Math.log10(interactionsCount + 1) / 1.5);

    // Family bonds possess an innate structural floor
    const baselineBonus = type === RelationshipEngine.TYPES.FAMILY ? 0.25 : 0.0;

    const raw = (normAffinity * 0.35) + (normTrust * 0.35) + (normFamiliarity * 0.30) + baselineBonus;
    return Number(Math.max(0.0, Math.min(1.0, raw)).toFixed(3));
  }

  /**
   * Add or update a directional bond between two citizens.
   *
   * @param {string} sourceId
   * @param {string} targetId
   * @param {Object} options
   * @param {string} [options.type='friendship']
   * @param {string} [options.role='acquaintance']
   * @param {number} [options.affinity=20]
   * @param {number} [options.trust=30]
   * @param {number} [options.interactionsCount=1]
   * @param {number} [options.tick=0]
   * @returns {Object} The updated relationship bond
   */
  setBond(sourceId, targetId, options = {}) {
    if (!sourceId || !targetId || sourceId === targetId) return null;

    this._ensureNode(sourceId);
    const bonds = this.socialGraph.get(sourceId);
    const existing = bonds.get(targetId) || {};

    const affinity = options.affinity ?? existing.affinity ?? 20;
    const trust = options.trust ?? existing.trust ?? 30;
    const interactionsCount = (options.interactionsCount ?? existing.interactionsCount ?? 0);
    const type = options.type || existing.type || RelationshipEngine.TYPES.FRIENDSHIP;
    const role = options.role || existing.role || RelationshipEngine.ROLES.ACQUAINTANCE;
    const lastInteractionTick = options.tick ?? existing.lastInteractionTick ?? 0;

    const strength = RelationshipEngine.calculateStrength(affinity, trust, interactionsCount, type);

    const bond = {
      sourceId,
      targetId,
      type,
      role,
      affinity: Math.max(-100, Math.min(100, affinity)),
      trust: Math.max(0, Math.min(100, trust)),
      interactionsCount,
      strength,
      lastInteractionTick,
      updatedAt: lastInteractionTick,
    };

    bonds.set(targetId, bond);
    return bond;
  }

  /**
   * Establish a reciprocal relationship between two citizens.
   *
   * @param {string} agentAId
   * @param {string} agentBId
   * @param {Object} options
   */
  setReciprocalBond(agentAId, agentBId, options = {}) {
    const bondA = this.setBond(agentAId, agentBId, options);
    const bondB = this.setBond(agentBId, agentAId, options);
    return { bondA, bondB };
  }

  /**
   * Record an interaction event between two citizens and update relationship metrics.
   *
   * @param {string} agentAId
   * @param {string} agentBId
   * @param {number} affinityDelta
   * @param {number} trustDelta
   * @param {number} tick
   */
  recordInteraction(agentAId, agentBId, affinityDelta = 5, trustDelta = 3, tick = 0) {
    if (!agentAId || !agentBId || agentAId === agentBId) return;

    this._ensureNode(agentAId);
    this._ensureNode(agentBId);

    const bondA = this.getBond(agentAId, agentBId) || {
      affinity: 15,
      trust: 25,
      interactionsCount: 0,
      type: RelationshipEngine.TYPES.FRIENDSHIP,
      role: RelationshipEngine.ROLES.ACQUAINTANCE,
    };

    const bondB = this.getBond(agentBId, agentAId) || {
      affinity: 15,
      trust: 25,
      interactionsCount: 0,
      type: RelationshipEngine.TYPES.FRIENDSHIP,
      role: RelationshipEngine.ROLES.ACQUAINTANCE,
    };

    const newAffA = Math.max(-100, Math.min(100, bondA.affinity + affinityDelta));
    const newTrustA = Math.max(0, Math.min(100, bondA.trust + trustDelta));
    const newCountA = (bondA.interactionsCount || 0) + 1;

    const newAffB = Math.max(-100, Math.min(100, bondB.affinity + affinityDelta));
    const newTrustB = Math.max(0, Math.min(100, bondB.trust + trustDelta));
    const newCountB = (bondB.interactionsCount || 0) + 1;

    // Categorize roles dynamically based on affinity
    let roleA = bondA.role;
    let roleB = bondB.role;
    if (bondA.type === RelationshipEngine.TYPES.FRIENDSHIP) {
      if (newAffA >= 80) roleA = RelationshipEngine.ROLES.CONFIDANT;
      else if (newAffA >= 50) roleA = RelationshipEngine.ROLES.FRIEND;
      else if (newAffA <= -40) roleA = RelationshipEngine.ROLES.RIVAL;
      else roleA = RelationshipEngine.ROLES.ACQUAINTANCE;
    }
    if (bondB.type === RelationshipEngine.TYPES.FRIENDSHIP) {
      if (newAffB >= 80) roleB = RelationshipEngine.ROLES.CONFIDANT;
      else if (newAffB >= 50) roleB = RelationshipEngine.ROLES.FRIEND;
      else if (newAffB <= -40) roleB = RelationshipEngine.ROLES.RIVAL;
      else roleB = RelationshipEngine.ROLES.ACQUAINTANCE;
    }

    this.setBond(agentAId, agentBId, {
      ...bondA,
      affinity: newAffA,
      trust: newTrustA,
      interactionsCount: newCountA,
      role: roleA,
      tick,
    });

    this.setBond(agentBId, agentAId, {
      ...bondB,
      affinity: newAffB,
      trust: newTrustB,
      interactionsCount: newCountB,
      role: roleB,
      tick,
    });
  }

  /**
   * Retrieve bond from source to target
   * @param {string} sourceId
   * @param {string} targetId
   * @returns {Object|null}
   */
  getBond(sourceId, targetId) {
    if (!this.socialGraph.has(sourceId)) return null;
    return this.socialGraph.get(sourceId).get(targetId) || null;
  }

  /**
   * Get all relationships for a given citizen
   * @param {string} agentId
   * @returns {Object[]}
   */
  getAgentRelationships(agentId) {
    if (!this.socialGraph.has(agentId)) return [];
    return Array.from(this.socialGraph.get(agentId).values());
  }

  /**
   * Retrieve friends or confidants of an agent
   * @param {string} agentId
   * @param {number} [minStrength=0.4]
   * @returns {Object[]}
   */
  getCloseTies(agentId, minStrength = 0.4) {
    return this.getAgentRelationships(agentId).filter((b) => b.strength >= minStrength);
  }

  /**
   * Initialize family and workplace bonds from initial agent data.
   * Deterministically pairs co-workers and residential roommates/families.
   *
   * @param {import('../agents/Agent.js').Agent[]} agents
   * @param {import('../core/RandomEngine.js').RandomEngine} [random=null]
   */
  seedInitialRelationships(agents, random = null) {
    if (!agents || agents.length === 0) return;

    // Group by residence (Family / Household)
    const householdGroups = new Map();
    // Group by employer (Workplace Colleague bonds)
    const workplaceGroups = new Map();

    for (const agent of agents) {
      this._ensureNode(agent.id);

      // Household groupings
      if (agent.residenceId) {
        if (!householdGroups.has(agent.residenceId)) {
          householdGroups.set(agent.residenceId, []);
        }
        householdGroups.get(agent.residenceId).push(agent);
      }

      // Workplace groupings
      if (agent.employerId) {
        if (!workplaceGroups.has(agent.employerId)) {
          workplaceGroups.set(agent.employerId, []);
        }
        workplaceGroups.get(agent.employerId).push(agent);
      }
    }

    // 1. Establish Family & Domestic ties
    for (const members of householdGroups.values()) {
      if (members.length < 2) continue;
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          const a = members[i];
          const b = members[j];
          const ageDiff = Math.abs(a.age - b.age);

          let role = RelationshipEngine.ROLES.SIBLING;
          if (ageDiff >= 18) {
            role = a.age > b.age ? RelationshipEngine.ROLES.PARENT : RelationshipEngine.ROLES.CHILD;
          } else if (ageDiff <= 6 && ((a.age >= 21 && b.age >= 21))) {
            role = RelationshipEngine.ROLES.SPOUSE;
          }

          this.setReciprocalBond(a.id, b.id, {
            type: RelationshipEngine.TYPES.FAMILY,
            role,
            affinity: 70,
            trust: 80,
            interactionsCount: 15,
            tick: 0,
          });
        }
      }
    }

    // 2. Establish Workplace Colleague ties
    for (const coworkers of workplaceGroups.values()) {
      if (coworkers.length < 2) continue;
      for (let i = 0; i < coworkers.length; i++) {
        for (let j = i + 1; j < coworkers.length; j++) {
          const a = coworkers[i];
          const b = coworkers[j];

          this.setReciprocalBond(a.id, b.id, {
            type: RelationshipEngine.TYPES.WORKPLACE,
            role: RelationshipEngine.ROLES.COLLEAGUE,
            affinity: 40,
            trust: 50,
            interactionsCount: 8,
            tick: 0,
          });
        }
      }
    }

    // 3. Establish initial proximity / social acquaintance friendships
    for (let i = 0; i < agents.length; i++) {
      const a = agents[i];
      for (let j = i + 1; j < agents.length; j++) {
        const b = agents[j];
        if (this.getBond(a.id, b.id)) continue; // Already bonded by family/work

        const dx = a.location.x - b.location.x;
        const dy = a.location.y - b.location.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Nearby neighbors have a baseline acquaintance chance
        if (dist <= 18) {
          const traitAffinity = Math.round(
            (1 - Math.abs(a.personalityTraits.rationality - b.personalityTraits.rationality)) * 40 +
            (1 - Math.abs(a.personalityTraits.socialAffinity - b.personalityTraits.socialAffinity)) * 30
          );

          if (traitAffinity >= 35) {
            this.setReciprocalBond(a.id, b.id, {
              type: RelationshipEngine.TYPES.FRIENDSHIP,
              role: RelationshipEngine.ROLES.ACQUAINTANCE,
              affinity: traitAffinity,
              trust: 35,
              interactionsCount: 2,
              tick: 0,
            });
          }
        }
      }
    }
  }

  /**
   * Gradual relationship decay and evolution over simulation time.
   * Without interaction, non-family relationship affinity slowly drifts toward neutral.
   *
   * @param {number} currentTick
   * @param {number} [decayInterval=24] Ticks between decay checks
   */
  stepDecay(currentTick, decayInterval = 24) {
    if (currentTick % decayInterval !== 0) return;

    for (const [sourceId, targetMap] of this.socialGraph.entries()) {
      for (const [targetId, bond] of targetMap.entries()) {
        // Family ties do not naturally decay easily
        if (bond.type === RelationshipEngine.TYPES.FAMILY) continue;

        const idleTicks = currentTick - (bond.lastInteractionTick || 0);
        if (idleTicks > 48) {
          // Slight regression toward 10
          if (bond.affinity > 10) bond.affinity = Math.max(10, bond.affinity - 1);
          if (bond.trust > 15) bond.trust = Math.max(15, bond.trust - 1);
          bond.strength = RelationshipEngine.calculateStrength(
            bond.affinity,
            bond.trust,
            bond.interactionsCount,
            bond.type
          );
        }
      }
    }
  }

  /**
   * Export internal social graph into adjacency nodes and edges representation
   * for frontend graph inspection and network analysis.
   *
   * @param {import('../agents/Agent.js').Agent[]} [agents=[]]
   * @returns {{ nodes: Object[], edges: Object[], density: number, avgDegree: number }}
   */
  getNetworkRepresentation(agents = []) {
    const agentMap = new Map();
    for (const a of agents) {
      agentMap.set(a.id, a);
    }

    const nodes = [];
    const edges = [];
    const processedPairs = new Set();
    let totalDegree = 0;

    for (const [sourceId, targetMap] of this.socialGraph.entries()) {
      const agent = agentMap.get(sourceId);
      const degree = targetMap.size;
      totalDegree += degree;

      nodes.push({
        id: sourceId,
        name: agent?.name || `Agent ${sourceId}`,
        occupation: agent?.occupation || 'citizen',
        socialAffinity: agent?.personalityTraits?.socialAffinity ?? 0.5,
        degree,
        cluster: agent?.location?.sector || 'General',
      });

      for (const [targetId, bond] of targetMap.entries()) {
        const pairKey = sourceId < targetId ? `${sourceId}_${targetId}` : `${targetId}_${sourceId}`;
        if (!processedPairs.has(pairKey)) {
          processedPairs.add(pairKey);
          edges.push({
            id: pairKey,
            source: sourceId,
            target: targetId,
            type: bond.type,
            role: bond.role,
            strength: bond.strength,
            affinity: bond.affinity,
            trust: bond.trust,
          });
        }
      }
    }

    const nodeCount = nodes.length;
    const maxEdges = (nodeCount * (nodeCount - 1)) / 2;
    const density = maxEdges > 0 ? Number((edges.length / maxEdges).toFixed(3)) : 0;
    const avgDegree = nodeCount > 0 ? Number((totalDegree / nodeCount).toFixed(2)) : 0;

    return {
      nodes,
      edges,
      nodeCount,
      edgeCount: edges.length,
      density,
      avgDegree,
    };
  }

  /**
   * Serialization
   */
  toJSON() {
    const serializedGraph = {};
    for (const [src, targets] of this.socialGraph.entries()) {
      serializedGraph[src] = {};
      for (const [tgt, bond] of targets.entries()) {
        serializedGraph[src][tgt] = bond;
      }
    }
    return serializedGraph;
  }

  /**
   * Deserialization
   * @param {Object} data
   */
  fromJSON(data) {
    this.socialGraph.clear();
    if (!data || typeof data !== 'object') return;

    for (const [src, targets] of Object.entries(data)) {
      const targetMap = new Map();
      for (const [tgt, bond] of Object.entries(targets)) {
        targetMap.set(tgt, { ...bond });
      }
      this.socialGraph.set(src, targetMap);
    }
  }
}

export default RelationshipEngine;
