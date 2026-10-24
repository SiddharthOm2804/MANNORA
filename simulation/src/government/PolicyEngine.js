/**
 * PolicyEngine manages legislation, directives, tax codes, and regulatory frameworks.
 *
 * Each policy modifies simulation state variables:
 * - taxation rate
 * - infrastructure investment
 * - healthcare spending
 * - education spending
 * - public resource subsidies
 * - emergency response / disaster preparedness
 *
 * Every policy enactment or repeal is recorded as an event in world history.
 */
export class PolicyEngine {
  static CATEGORIES = {
    FISCAL: 'fiscal',
    INFRASTRUCTURE: 'infrastructure',
    HEALTHCARE: 'healthcare',
    EDUCATION: 'education',
    RESOURCES: 'resources',
    EMERGENCY: 'emergency',
  };

  /**
   * Predefined policy definitions available for enactment
   */
  static DEFINITIONS = {
    // 1. INFRASTRUCTURE INVESTMENT
    EXPAND_TRANSIT_GRID: {
      id: 'pol_infra_transit',
      name: 'High-Throughput Arterial Transit Grid',
      category: 'infrastructure',
      description: 'Expands transit and logistical corridors, increasing building efficiency and civic mobility.',
      costPerTick: 45,
      modifiers: {
        infrastructureCapacityBonus: 0.15,
        buildingEfficiencyDelta: 0.05,
        productivityMultiplier: 1.08,
      },
    },
    GREEN_ARCOLOGY_SUBSIDY: {
      id: 'pol_infra_arcology',
      name: 'Ecological Arcology Renovation Act',
      category: 'infrastructure',
      description: 'Mandates solar tiles and water recycling on all commercial and residential structures.',
      costPerTick: 35,
      modifiers: {
        pollutionDelta: -4,
        sustainabilityBonus: 8,
      },
    },

    // 2. TAXATION & FISCAL
    PROGRESSIVE_EQUITY_TAX: {
      id: 'pol_tax_progressive',
      name: 'Syntropic Progressive Dividend Tax',
      category: 'fiscal',
      description: 'Adjusts statutory tax rate to 18% with targeted poverty tax credits.',
      costPerTick: 0,
      targetTaxRate: 0.18,
      modifiers: {
        happinessDelta: -1, // Mild initial friction
        povertyReliefFactor: 0.25,
      },
    },
    COMMERCIAL_FREE_TRADE_ZONE: {
      id: 'pol_tax_freetrade',
      name: 'Special Economic Enterprise Zone',
      category: 'fiscal',
      description: 'Lowers corporate tax rate to 11% to stimulate venture formation and employment.',
      costPerTick: 0,
      targetTaxRate: 0.11,
      modifiers: {
        businessFormationMultiplier: 1.25,
        happinessDelta: 2,
      },
    },

    // 3. HEALTHCARE
    UNIVERSAL_SYNTH_HEALTHCARE: {
      id: 'pol_health_universal',
      name: 'Comprehensive Bio-Synthetic Healthcare',
      category: 'healthcare',
      description: 'Free preventative clinic access, genetic repair therapies, and water quality inspection.',
      costPerTick: 50,
      modifiers: {
        healthDelta: 6,
        mortalityMultiplier: 0.60,
        happinessDelta: 4,
      },
    },

    // 4. EDUCATION & RESEARCH
    QUANTUM_ACADEMY_ENDOWMENT: {
      id: 'pol_edu_academy',
      name: 'Universal Vocational & Cybernetics Academy',
      category: 'education',
      description: 'Public education funding accelerating scientific discovery and worker craftsmanship.',
      costPerTick: 40,
      modifiers: {
        skillGrowthMultiplier: 1.25,
        technologyProductionMultiplier: 1.15,
        educationScoreDelta: 8,
      },
    },

    // 5. PUBLIC RESOURCES
    STRATEGIC_UTILITY_RESERVES: {
      id: 'pol_res_strategic',
      name: 'Strategic Resource Buffer Mandate',
      category: 'resources',
      description: 'Subsidizes base electricity and agricultural tariffs to protect against market shortages.',
      costPerTick: 30,
      modifiers: {
        marketPriceDampener: 0.12,
        deficitResistance: 0.30,
      },
    },

    // 6. EMERGENCY RESPONSE
    GRID_FAILSAFE_PROTOCOL: {
      id: 'pol_emg_failsafe',
      name: 'Civil Protection & Crisis Protocol',
      category: 'emergency',
      description: 'Maintains automated disaster response relays and reserve emergency supplies.',
      costPerTick: 25,
      modifiers: {
        disasterDamageReduction: 0.40,
        civilStabilityFloor: 65,
      },
    },
  };

  /**
   * @param {Object} [config]
   */
  constructor(config = {}) {
    /**
     * Set of active policy IDs
     * @type {Set<string>}
     */
    this.activePolicies = new Set(
      Array.isArray(config.activePolicies)
        ? config.activePolicies
        : ['pol_infra_transit', 'pol_health_universal']
    );

    /**
     * History log of enacted/repealed policies
     * Array<{ id, policyId, name, action: 'ENACT'|'REPEAL', tick, timestamp, rationale }>
     * @type {Array<Object>}
     */
    this.policyHistory = Array.isArray(config.policyHistory) ? [...config.policyHistory] : [];
  }

  /**
   * Enact a policy
   *
   * @param {string} policyId
   * @param {import('../core/WorldState.js').WorldState} worldState
   * @param {Object} [options={}]
   * @returns {{ success: boolean, policy: Object|null, message: string }}
   */
  enactPolicy(policyId, worldState, options = {}) {
    const definition = PolicyEngine.DEFINITIONS[policyId] ||
      Object.values(PolicyEngine.DEFINITIONS).find((p) => p.id === policyId);

    if (!definition) {
      return { success: false, policy: null, message: `Policy "${policyId}" not found in registry.` };
    }

    if (this.activePolicies.has(definition.id)) {
      return { success: false, policy: definition, message: `Policy "${definition.name}" is already active.` };
    }

    this.activePolicies.add(definition.id);

    // Apply immediate variables if specified
    if (definition.targetTaxRate !== undefined && worldState?.economy) {
      worldState.economy.taxRate = definition.targetTaxRate;
      if (worldState.metrics) worldState.metrics.taxRate = definition.targetTaxRate;
    }

    const tick = options.tick ?? worldState?.tick ?? 0;
    const historyEntry = {
      id: `pol_evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      policyId: definition.id,
      name: definition.name,
      category: definition.category,
      action: 'ENACT',
      tick,
      costPerTick: definition.costPerTick,
      rationale: options.rationale || 'Executive governance decree',
      timestamp: new Date().toISOString(),
    };

    this.policyHistory.push(historyEntry);

    // Record as global simulation event in WorldState
    if (worldState) {
      const evt = {
        id: historyEntry.id,
        title: `Policy Enacted: ${definition.name}`,
        type: 'POLICY_ENACTED',
        category: 'governance',
        severity: 1,
        startedAtTick: tick,
        totalDuration: 1,
        remainingTicks: 1,
        description: definition.description,
        modifiers: definition.modifiers,
      };
      if (typeof worldState.addActiveEvent === 'function') {
        worldState.addActiveEvent(evt);
      } else if (typeof worldState.addEvent === 'function') {
        worldState.addEvent(evt);
      }
      if (typeof worldState.logEvent === 'function') {
        worldState.logEvent(evt);
      }
    }

    return {
      success: true,
      policy: definition,
      message: `Successfully enacted "${definition.name}".`,
    };
  }

  /**
   * Repeal an active policy
   *
   * @param {string} policyId
   * @param {import('../core/WorldState.js').WorldState} worldState
   * @param {Object} [options={}]
   * @returns {{ success: boolean, message: string }}
   */
  repealPolicy(policyId, worldState, options = {}) {
    const definition = PolicyEngine.DEFINITIONS[policyId] ||
      Object.values(PolicyEngine.DEFINITIONS).find((p) => p.id === policyId);

    if (!definition || !this.activePolicies.has(definition.id)) {
      return { success: false, message: `Policy "${policyId}" is not currently active.` };
    }

    this.activePolicies.delete(definition.id);

    const tick = options.tick ?? worldState?.tick ?? 0;
    const historyEntry = {
      id: `pol_evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      policyId: definition.id,
      name: definition.name,
      category: definition.category,
      action: 'REPEAL',
      tick,
      rationale: options.rationale || 'Policy sunset / legislative revision',
      timestamp: new Date().toISOString(),
    };

    this.policyHistory.push(historyEntry);

    if (worldState) {
      const evt = {
        id: historyEntry.id,
        title: `Policy Repealed: ${definition.name}`,
        type: 'POLICY_REPEALED',
        category: 'governance',
        severity: 1,
        startedAtTick: tick,
        totalDuration: 1,
        remainingTicks: 1,
        description: `Council repealed policy "${definition.name}".`,
      };
      if (typeof worldState.addActiveEvent === 'function') {
        worldState.addActiveEvent(evt);
      } else if (typeof worldState.addEvent === 'function') {
        worldState.addEvent(evt);
      }
      if (typeof worldState.logEvent === 'function') {
        worldState.logEvent(evt);
      }
    }

    return { success: true, message: `Repealed "${definition.name}".` };
  }

  /**
   * Compute aggregated modifiers across all active policies
   * @returns {{ totalCostPerTick: number, modifiers: Object }}
   */
  getAggregateModifiers() {
    let totalCostPerTick = 0;
    const aggregated = {
      healthDelta: 0,
      happinessDelta: 0,
      pollutionDelta: 0,
      sustainabilityBonus: 0,
      productivityMultiplier: 1.0,
      buildingEfficiencyDelta: 0,
      skillGrowthMultiplier: 1.0,
      technologyProductionMultiplier: 1.0,
      disasterDamageReduction: 0,
    };

    for (const policyId of this.activePolicies) {
      const def = Object.values(PolicyEngine.DEFINITIONS).find((p) => p.id === policyId);
      if (!def) continue;

      totalCostPerTick += (def.costPerTick || 0);

      if (def.modifiers) {
        if (def.modifiers.healthDelta) aggregated.healthDelta += def.modifiers.healthDelta;
        if (def.modifiers.happinessDelta) aggregated.happinessDelta += def.modifiers.happinessDelta;
        if (def.modifiers.pollutionDelta) aggregated.pollutionDelta += def.modifiers.pollutionDelta;
        if (def.modifiers.sustainabilityBonus) aggregated.sustainabilityBonus += def.modifiers.sustainabilityBonus;
        if (def.modifiers.productivityMultiplier) aggregated.productivityMultiplier *= def.modifiers.productivityMultiplier;
        if (def.modifiers.buildingEfficiencyDelta) aggregated.buildingEfficiencyDelta += def.modifiers.buildingEfficiencyDelta;
        if (def.modifiers.skillGrowthMultiplier) aggregated.skillGrowthMultiplier *= def.modifiers.skillGrowthMultiplier;
        if (def.modifiers.technologyProductionMultiplier) aggregated.technologyProductionMultiplier *= def.modifiers.technologyProductionMultiplier;
        if (def.modifiers.disasterDamageReduction) aggregated.disasterDamageReduction = Math.max(aggregated.disasterDamageReduction, def.modifiers.disasterDamageReduction);
      }
    }

    return { totalCostPerTick, modifiers: aggregated };
  }

  /**
   * Get active policies list with metadata
   */
  getActivePolicies() {
    return Array.from(this.activePolicies).map((id) => {
      const def = Object.values(PolicyEngine.DEFINITIONS).find((p) => p.id === id);
      return def || { id, name: id, category: 'general' };
    });
  }

  /**
   * Get all registered policies definitions
   */
  getAllDefinitions() {
    return Object.values(PolicyEngine.DEFINITIONS);
  }
}

export default PolicyEngine;
