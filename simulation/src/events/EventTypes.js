/**
 * Canonical Event Types and Definitions for NEURAL CITY (Phase 11: Event Engine).
 */
export const EVENT_TYPES = {
  // 1. Resource & Environmental Shocks
  RESOURCE_SHORTAGE: 'resource_shortage',
  ENERGY_SHORTAGE: 'energy_shortage',
  WATER_SHORTAGE: 'water_shortage',
  NATURAL_DISASTER: 'natural_disaster',

  // 2. Structural & Infrastructure Failures
  INFRASTRUCTURE_FAILURE: 'infrastructure_failure',

  // 3. Economic & Market Shocks
  ECONOMIC_CRASH: 'economic_crash',
  MARKET_SHOCK: 'market_shock',

  // 4. Biological & Demographic Events
  DISEASE_OUTBREAK: 'disease_outbreak',
  MIGRATION_WAVE: 'migration_wave',

  // 5. Scientific & Technological Catalysts
  TECHNOLOGY_BREAKTHROUGH: 'technology_breakthrough',

  // System & Engine Lifecycle Events (Phase 4 compatibility)
  ENGINE_INIT: 'engine:init',
  ENGINE_START: 'engine:start',
  ENGINE_PAUSE: 'engine:pause',
  ENGINE_RESUME: 'engine:resume',
  ENGINE_STOP: 'engine:stop',
  ENGINE_RESET: 'engine:reset',
  ENGINE_TICK: 'engine:tick',
  ENGINE_ROLLBACK: 'engine:rollback',
  ENGINE_ERROR: 'engine:error',
  HEALTH_CHECK: 'system:health_check',
  DB_CONNECTED: 'db:connected',
  DB_DISCONNECTED: 'db:disconnected',
  DB_ERROR: 'db:error',
};

/**
 * Event Severity tiers
 */
export const EVENT_SEVERITY = {
  LOW: 1,
  MODERATE: 2,
  HIGH: 3,
  CRITICAL: 4,
  CATASTROPHIC: 5,
};

/**
 * Event Categories
 */
export const EVENT_CATEGORIES = {
  RESOURCE: 'resource',
  INFRASTRUCTURE: 'infrastructure',
  ECONOMIC: 'economic',
  HEALTH: 'health',
  ENVIRONMENTAL: 'environmental',
  TECHNOLOGY: 'technology',
  DEMOGRAPHIC: 'demographic',
};

/**
 * Canonical Catalog Definitions for all 9 required event archetypes + custom triggers.
 */
export const EVENT_DEFINITIONS = {
  [EVENT_TYPES.RESOURCE_SHORTAGE]: {
    type: EVENT_TYPES.RESOURCE_SHORTAGE,
    title: 'Resource Shortage',
    category: EVENT_CATEGORIES.RESOURCE,
    defaultSeverity: EVENT_SEVERITY.HIGH,
    defaultDuration: 12,
    defaultCause: 'Critical supply chain severance and extraction bottleneck',
    defaultTargetResource: 'minerals',
    recoveryBehavior: 'GRADUAL_RESTORATION',
    description: 'Sudden depletion of critical industrial raw materials and minerals halt secondary production.',
    effects: {
      resourceDeltas: { minerals: -2000, rawMaterials: -1500 },
      modifiers: {
        rawMaterialsProductionMultiplier: 0.4,
        mineralsProductionMultiplier: 0.3,
        gdpMultiplier: 0.85,
        inflationDelta: 0.05,
        happinessDelta: -6,
      },
      agentImpact: {
        needDecayMultiplier: 1.2,
        anxietyDelta: 15,
      },
      governmentImpact: {
        approvalDelta: -8,
        emergencyExpense: 120,
      },
    },
  },

  [EVENT_TYPES.INFRASTRUCTURE_FAILURE]: {
    type: EVENT_TYPES.INFRASTRUCTURE_FAILURE,
    title: 'Infrastructure Failure',
    category: EVENT_CATEGORIES.INFRASTRUCTURE,
    defaultSeverity: EVENT_SEVERITY.HIGH,
    defaultDuration: 10,
    defaultCause: 'Substation explosion and structural conduit overload',
    recoveryBehavior: 'INFRASTRUCTURE_REPAIR',
    description: 'Major arterial transit links and industrial power conduits collapse across municipal sectors.',
    effects: {
      buildingDamage: {
        healthDamage: 30, // applied to target buildings
        efficiencyReduction: 0.5,
      },
      modifiers: {
        productivityMultiplier: 0.65,
        stabilityDelta: -12,
        happinessDelta: -8,
      },
      agentImpact: {
        restDecayMultiplier: 1.5,
        safetyDelta: -20,
      },
      governmentImpact: {
        approvalDelta: -14,
        emergencyExpense: 250,
      },
    },
  },

  [EVENT_TYPES.ECONOMIC_CRASH]: {
    type: EVENT_TYPES.ECONOMIC_CRASH,
    title: 'Economic Crash',
    category: EVENT_CATEGORIES.ECONOMIC,
    defaultSeverity: EVENT_SEVERITY.CRITICAL,
    defaultDuration: 16,
    defaultCause: 'Liquidity insolvency contagion and credit market panic',
    recoveryBehavior: 'ECONOMIC_STABILIZATION',
    description: 'Systemic financial liquidity contraction triggers asset liquidation and enterprise insolvency.',
    effects: {
      treasuryImpactMultiplier: 0.75, // drains 25% treasury
      modifiers: {
        gdpMultiplier: 0.6,
        inflationDelta: 0.08,
        productivityMultiplier: 0.75,
        stabilityDelta: -18,
        happinessDelta: -12,
      },
      priceSpikeMultiplier: 1.8,
      agentImpact: {
        wealthLossRatio: 0.2,
        fulfillmentDelta: -25,
      },
      governmentImpact: {
        taxIntakeMultiplier: 0.7,
        approvalDelta: -20,
      },
    },
  },

  [EVENT_TYPES.NATURAL_DISASTER]: {
    type: EVENT_TYPES.NATURAL_DISASTER,
    title: 'Natural Disaster',
    category: EVENT_CATEGORIES.ENVIRONMENTAL,
    defaultSeverity: EVENT_SEVERITY.CRITICAL,
    defaultDuration: 8,
    defaultCause: 'Severe tectonic shear and cyber-atmospheric cyclonic event',
    recoveryBehavior: 'CIVIC_RECONSTRUCTION',
    description: 'Catastrophic seismic and atmospheric shear inflicts widespread structural and biosphere casualties.',
    effects: {
      casualtyRate: 0.03, // 3% population loss
      buildingDamage: {
        healthDamage: 40,
        efficiencyReduction: 0.6,
      },
      resourceDeltas: { energy: -3000, water: -2500, agriculture: -2000 },
      modifiers: {
        healthDelta: -15,
        happinessDelta: -20,
        stabilityDelta: -25,
      },
      agentImpact: {
        safetyDelta: -40,
        healthDelta: -25,
      },
      governmentImpact: {
        emergencyExpense: 400,
        approvalDelta: -16,
      },
    },
  },

  [EVENT_TYPES.DISEASE_OUTBREAK]: {
    type: EVENT_TYPES.DISEASE_OUTBREAK,
    title: 'Disease Outbreak',
    category: EVENT_CATEGORIES.HEALTH,
    defaultSeverity: EVENT_SEVERITY.HIGH,
    defaultDuration: 14,
    defaultCause: 'Synthetic aerosol pathogen escape with respiratory contagion',
    recoveryBehavior: 'EPIDEMIOLOGICAL_CONTAINMENT',
    description: 'Pathogen contagion spreads across residential sectors, lowering citizen health and productivity.',
    effects: {
      infectionSpreadRate: 0.08,
      mortalityRate: 0.015,
      modifiers: {
        healthDelta: -25,
        productivityMultiplier: 0.6,
        happinessDelta: -15,
        stabilityDelta: -14,
      },
      agentImpact: {
        healthDecayRate: 4.5,
        restDecayMultiplier: 1.6,
      },
      governmentImpact: {
        healthcareExpenseMultiplier: 1.8,
        approvalDelta: -12,
      },
    },
  },

  [EVENT_TYPES.TECHNOLOGY_BREAKTHROUGH]: {
    type: EVENT_TYPES.TECHNOLOGY_BREAKTHROUGH,
    title: 'Technology Breakthrough',
    category: EVENT_CATEGORIES.TECHNOLOGY,
    defaultSeverity: EVENT_SEVERITY.MODERATE,
    defaultDuration: 20,
    defaultCause: 'Quantum neural computing milestone and algorithmic fusion',
    recoveryBehavior: 'PERMANENT_EFFICIENCY_GAIN',
    description: 'Breakthrough quantum synthesis multiplies technological generation and industrial efficiency.',
    effects: {
      resourceDeltas: { technology: +3000 },
      modifiers: {
        techProductionMultiplier: 2.2,
        energyProductionMultiplier: 1.35,
        productivityMultiplier: 1.25,
        gdpMultiplier: 1.3,
        happinessDelta: +10,
        stabilityDelta: +8,
      },
      agentImpact: {
        fulfillmentDelta: +20,
      },
      governmentImpact: {
        approvalDelta: +15,
      },
    },
  },

  [EVENT_TYPES.MARKET_SHOCK]: {
    type: EVENT_TYPES.MARKET_SHOCK,
    title: 'Market Shock',
    category: EVENT_CATEGORIES.ECONOMIC,
    defaultSeverity: EVENT_SEVERITY.HIGH,
    defaultDuration: 10,
    defaultCause: 'Off-world tariff embargo and extreme commodity speculation',
    recoveryBehavior: 'PRICE_EQUILIBRIUM_RESTORE',
    description: 'Severe speculative volatility shocks commodity pricing across energy, minerals, and tech.',
    effects: {
      priceVolatility: {
        energyMultiplier: 2.1,
        waterMultiplier: 1.8,
        mineralsMultiplier: 2.4,
        agricultureMultiplier: 1.7,
      },
      modifiers: {
        inflationDelta: 0.07,
        gdpMultiplier: 0.85,
        happinessDelta: -7,
      },
      agentImpact: {
        wealthCostMultiplier: 1.5,
      },
      governmentImpact: {
        approvalDelta: -9,
      },
    },
  },

  [EVENT_TYPES.MIGRATION_WAVE]: {
    type: EVENT_TYPES.MIGRATION_WAVE,
    title: 'Migration Wave',
    category: EVENT_CATEGORIES.DEMOGRAPHIC,
    defaultSeverity: EVENT_SEVERITY.MODERATE,
    defaultDuration: 12,
    defaultCause: 'Extraterritorial climate displacement and refugee influx',
    recoveryBehavior: 'CIVIC_ABSORPTION',
    description: 'Mass influx of citizens arriving at metropolitan gateways expands labor force and housing pressure.',
    effects: {
      populationInfluxRate: 0.12, // +12% population
      resourceDeltas: { water: -800, agriculture: -1000 },
      modifiers: {
        waterConsumptionMultiplier: 1.35,
        agricultureConsumptionMultiplier: 1.35,
        energyConsumptionMultiplier: 1.25,
        unemploymentDelta: +0.08,
        stabilityDelta: -5,
      },
      agentImpact: {
        socialFrictionDelta: 10,
      },
      governmentImpact: {
        publicServiceLoadMultiplier: 1.3,
        approvalDelta: -5,
      },
    },
  },

  [EVENT_TYPES.ENERGY_SHORTAGE]: {
    type: EVENT_TYPES.ENERGY_SHORTAGE,
    title: 'Energy Shortage',
    category: EVENT_CATEGORIES.RESOURCE,
    defaultSeverity: EVENT_SEVERITY.HIGH,
    defaultDuration: 10,
    defaultCause: 'Sub-orbital fusion relay failure and antimatter turbine trip',
    recoveryBehavior: 'GRID_REBALANCING',
    description: 'Generation plants trip offline, plunging sectors into rolling blackouts and lowering factory output.',
    effects: {
      resourceDeltas: { energy: -3500 },
      modifiers: {
        energyProductionMultiplier: 0.25,
        productivityMultiplier: 0.5,
        happinessDelta: -10,
        stabilityDelta: -12,
      },
      buildingDamage: {
        efficiencyReduction: 0.4,
      },
      agentImpact: {
        safetyDelta: -15,
        restDecayMultiplier: 1.4,
      },
      governmentImpact: {
        approvalDelta: -15,
        emergencyExpense: 180,
      },
    },
  },

  [EVENT_TYPES.WATER_SHORTAGE]: {
    type: EVENT_TYPES.WATER_SHORTAGE,
    title: 'Water Shortage',
    category: EVENT_CATEGORIES.RESOURCE,
    defaultSeverity: EVENT_SEVERITY.CRITICAL,
    defaultDuration: 10,
    defaultCause: 'Atmospheric moisture condenser drought and aqueduct contamination',
    recoveryBehavior: 'AQUIFER_RECHARGE',
    description: 'Aqueduct reservoirs drop below survival reserves, triggering rationing and severe dehydration stress.',
    effects: {
      resourceDeltas: { water: -4000 },
      modifiers: {
        waterProductionMultiplier: 0.2,
        agricultureProductionMultiplier: 0.4,
        healthDelta: -12,
        happinessDelta: -14,
        stabilityDelta: -15,
      },
      agentImpact: {
        hungerDecayMultiplier: 1.5,
        healthDecayRate: 3.0,
      },
      governmentImpact: {
        approvalDelta: -18,
        emergencyExpense: 200,
      },
    },
  },
};

