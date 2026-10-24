/**
 * CommunityEngine creates and coordinates civic, professional, geographic, and interest-based communities.
 *
 * Community Types:
 * - 'geographic' (Neighborhood / District collectives based on residence location)
 * - 'occupational' (Guilds / Professional Associations based on occupation)
 * - 'interest' (Philosophical, Ecological, Technological, Cultural clubs based on personality traits & skills)
 * - 'kinship' (Clans / Family clusters based on dense genealogical ties)
 *
 * Deterministic community metrics:
 * - Cohesion [0.0, 1.0]: density and average strength of internal relationships
 * - Capital / Treasury: collective reserves for community welfare & mutual aid
 * - Activity Level: recent member interactions and participation
 */
export class CommunityEngine {
  static TYPES = {
    GEOGRAPHIC: 'geographic',
    OCCUPATIONAL: 'occupational',
    INTEREST: 'interest',
    KINSHIP: 'kinship',
  };

  constructor() {
    /**
     * Map<communityId, CommunityRecord>
     * @type {Map<string, Object>}
     */
    this.communities = new Map();

    /**
     * Reverse lookup: Map<agentId, Set<communityId>>
     * @type {Map<string, Set<string>>}
     */
    this.agentCommunities = new Map();
  }

  /**
   * Register a new community
   * @param {Object} config
   * @returns {Object}
   */
  createCommunity(config) {
    if (!config.id) {
      throw new Error('Community must have a valid id');
    }

    const community = {
      id: config.id,
      name: config.name || `Community ${config.id}`,
      type: config.type || CommunityEngine.TYPES.GEOGRAPHIC,
      description: config.description || '',
      leaderId: config.leaderId || null,
      members: new Set(config.members || []),
      cohesion: Number(config.cohesion ?? 0.65),
      treasury: Number(config.treasury ?? 500),
      focusArea: config.focusArea || 'civic',
      activityLevel: Number(config.activityLevel ?? 0.7),
      initiatives: Array.isArray(config.initiatives) ? config.initiatives : [],
      createdAtTick: config.createdAtTick ?? 0,
    };

    this.communities.set(community.id, community);

    // Update reverse lookup
    for (const memberId of community.members) {
      this._addMemberToReverseLookup(memberId, community.id);
    }

    return community;
  }

  /**
   * Add agent to reverse lookup
   * @private
   */
  _addMemberToReverseLookup(agentId, communityId) {
    if (!this.agentCommunities.has(agentId)) {
      this.agentCommunities.set(agentId, new Set());
    }
    this.agentCommunities.get(agentId).add(communityId);
  }

  /**
   * Add member to existing community
   * @param {string} communityId
   * @param {string} agentId
   */
  addMember(communityId, agentId) {
    const comm = this.communities.get(communityId);
    if (!comm) return false;

    comm.members.add(agentId);
    this._addMemberToReverseLookup(agentId, communityId);
    return true;
  }

  /**
   * Remove member from community
   * @param {string} communityId
   * @param {string} agentId
   */
  removeMember(communityId, agentId) {
    const comm = this.communities.get(communityId);
    if (!comm) return false;

    comm.members.delete(agentId);
    if (this.agentCommunities.has(agentId)) {
      this.agentCommunities.get(agentId).delete(communityId);
    }
    return true;
  }

  /**
   * Get all communities an agent belongs to
   * @param {string} agentId
   * @returns {Object[]}
   */
  getAgentCommunities(agentId) {
    const commIds = this.agentCommunities.get(agentId);
    if (!commIds) return [];

    const results = [];
    for (const cid of commIds) {
      const comm = this.communities.get(cid);
      if (comm) results.push(comm);
    }
    return results;
  }

  /**
   * Get all registered communities
   * @returns {Object[]}
   */
  getAllCommunities() {
    return Array.from(this.communities.values());
  }

  /**
   * Get community by ID
   * @param {string} id
   * @returns {Object|null}
   */
  getCommunity(id) {
    return this.communities.get(id) || null;
  }

  /**
   * Automatically detect and form communities based on:
   * 1. Location (Sector & residential clustering)
   * 2. Occupation (Guilds)
   * 3. Shared Interests / Personality traits
   *
   * @param {import('../agents/Agent.js').Agent[]} agents
   * @param {import('./RelationshipEngine.js').RelationshipEngine} relationshipEngine
   * @param {number} tick
   */
  formCommunities(agents, relationshipEngine, tick = 0) {
    if (!agents || agents.length === 0) return;

    // 1. FORM GEOGRAPHIC COMMUNITIES (Districts & Neighborhoods)
    const sectorGroups = new Map();
    for (const a of agents) {
      const sector = a.location?.sector || 'District Core';
      if (!sectorGroups.has(sector)) {
        sectorGroups.set(sector, []);
      }
      sectorGroups.get(sector).push(a);
    }

    for (const [sector, members] of sectorGroups.entries()) {
      const commId = `comm_geo_${sector.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      if (!this.communities.has(commId)) {
        // Pick leader as agent with highest socialAffinity & ambition
        const leader = [...members].sort((a, b) => 
          (b.personalityTraits.socialAffinity + b.personalityTraits.ambition) -
          (a.personalityTraits.socialAffinity + a.personalityTraits.ambition)
        )[0];

        this.createCommunity({
          id: commId,
          name: `${sector} Resident Council`,
          type: CommunityEngine.TYPES.GEOGRAPHIC,
          description: `Civic association advocating for infrastructure and well-being in ${sector}.`,
          leaderId: leader ? leader.id : null,
          members: members.map((m) => m.id),
          cohesion: 0.70,
          treasury: 1200,
          focusArea: 'civic_welfare',
          activityLevel: 0.8,
          createdAtTick: tick,
        });
      } else {
        // Update membership
        const comm = this.communities.get(commId);
        for (const m of members) {
          comm.members.add(m.id);
          this._addMemberToReverseLookup(m.id, commId);
        }
      }
    }

    // 2. FORM OCCUPATIONAL GUILDS
    const occupationGroups = new Map();
    for (const a of agents) {
      const occ = a.occupation || 'citizen';
      if (!occupationGroups.has(occ)) {
        occupationGroups.set(occ, []);
      }
      occupationGroups.get(occ).push(a);
    }

    for (const [occ, members] of occupationGroups.entries()) {
      if (members.length < 2) continue;
      const commId = `comm_guild_${occ.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      const guildNames = {
        engineer: 'Technological & Architecture Syndicate',
        scientist: 'Applied Cybernetics & Research Institute',
        merchant: 'Commercial Trade & Mercator Guild',
        farmer: 'Bio-Sustain & Agrarian Collective',
        technician: 'Grid Maintenance & Systems Union',
        administrator: 'Civil Governance & Planning Assembly',
        entrepreneur: 'Venture Capital & Founders Circle',
      };

      if (!this.communities.has(commId)) {
        const leader = [...members].sort((a, b) => (b.wealth || 0) - (a.wealth || 0))[0];
        this.createCommunity({
          id: commId,
          name: guildNames[occ] || `${occ.toUpperCase()} Professional Guild`,
          type: CommunityEngine.TYPES.OCCUPATIONAL,
          description: `Industry guild coordinating wages, working conditions, and vocational training for ${occ}s.`,
          leaderId: leader ? leader.id : null,
          members: members.map((m) => m.id),
          cohesion: 0.75,
          treasury: 2500,
          focusArea: 'industry_cooperation',
          activityLevel: 0.85,
          createdAtTick: tick,
        });
      } else {
        const comm = this.communities.get(commId);
        for (const m of members) {
          comm.members.add(m.id);
          this._addMemberToReverseLookup(m.id, commId);
        }
      }
    }

    // 3. FORM SHARED INTEREST & PHILOSOPHY CLUBS
    // Ecological Society: high adaptability + science skills
    const ecologicalCandidates = agents.filter((a) => 
      (a.personalityTraits.adaptability >= 0.65 || a.skills.farming >= 0.6)
    );
    if (ecologicalCandidates.length >= 3 && !this.communities.has('comm_interest_ecological')) {
      this.createCommunity({
        id: 'comm_interest_ecological',
        name: 'Syntropic Ecology & Green Core Society',
        type: CommunityEngine.TYPES.INTEREST,
        description: 'Citizen initiative fostering closed-loop recycling and environmental preservation.',
        leaderId: ecologicalCandidates[0].id,
        members: ecologicalCandidates.map((m) => m.id),
        cohesion: 0.82,
        treasury: 800,
        focusArea: 'environmental_advocacy',
        activityLevel: 0.75,
        createdAtTick: tick,
      });
    }

    // High Rationality Innovation Circle
    const innovators = agents.filter((a) => a.personalityTraits.rationality >= 0.75 && a.personalityTraits.ambition >= 0.65);
    if (innovators.length >= 3 && !this.communities.has('comm_interest_innovation')) {
      this.createCommunity({
        id: 'comm_interest_innovation',
        name: 'Neural Synthesis & Quantum Pioneers',
        type: CommunityEngine.TYPES.INTEREST,
        description: 'Think tank exploring high-efficiency automation and computational governance.',
        leaderId: innovators[0].id,
        members: innovators.map((m) => m.id),
        cohesion: 0.78,
        treasury: 1500,
        focusArea: 'technological_acceleration',
        activityLevel: 0.9,
        createdAtTick: tick,
      });
    }
  }

  /**
   * Recalculate community cohesion based on the internal relationship strength
   * among community members.
   *
   * @param {import('./RelationshipEngine.js').RelationshipEngine} relationshipEngine
   */
  updateCommunityCohesion(relationshipEngine) {
    for (const comm of this.communities.values()) {
      const memberList = Array.from(comm.members);
      if (memberList.length < 2) {
        comm.cohesion = 0.5;
        continue;
      }

      let totalPairStrength = 0;
      let evaluatedPairs = 0;

      // Sample or evaluate pairs
      for (let i = 0; i < memberList.length; i++) {
        for (let j = i + 1; j < memberList.length; j++) {
          const aId = memberList[i];
          const bId = memberList[j];
          const bond = relationshipEngine.getBond(aId, bId);
          if (bond) {
            totalPairStrength += bond.strength;
            evaluatedPairs++;
          }
        }
      }

      const possiblePairs = (memberList.length * (memberList.length - 1)) / 2;
      const connectionRatio = possiblePairs > 0 ? (evaluatedPairs / possiblePairs) : 0;
      const avgStrength = evaluatedPairs > 0 ? (totalPairStrength / evaluatedPairs) : 0.3;

      // Cohesion blends network density with bond strength
      comm.cohesion = Number(
        Math.max(0.1, Math.min(1.0, (avgStrength * 0.65) + (connectionRatio * 0.35))).toFixed(3)
      );
    }
  }

  /**
   * Serialize for persistence or state snapshot
   */
  toJSON() {
    const list = [];
    for (const comm of this.communities.values()) {
      list.push({
        ...comm,
        members: Array.from(comm.members),
      });
    }
    return list;
  }

  /**
   * Restore from serialized structure
   */
  fromJSON(data) {
    this.communities.clear();
    this.agentCommunities.clear();
    if (!Array.isArray(data)) return;

    for (const item of data) {
      this.createCommunity(item);
    }
  }
}

export default CommunityEngine;
