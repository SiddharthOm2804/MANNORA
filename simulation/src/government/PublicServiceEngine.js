/**
 * PublicServiceEngine manages operational delivery, capacity, and funding across municipal services:
 *
 * 1. Healthcare Services (clinics, hospital beds, preventative care)
 * 2. Education & Vocational Services (schools, academies, research labs)
 * 3. Infrastructure & Transit (roads, electrical grid, water distribution)
 * 4. Public Resources & Strategic Buffers (tariffs, food reserves, solar relays)
 * 5. Emergency Services & Disaster Preparedness (fire, medical dispatch, civil defense)
 *
 * Each service maintains:
 * - budgetAllocation (credits per tick)
 * - efficiency [0.0, 1.0]
 * - capacity (population served)
 * - satisfactionScore [0 - 100]
 */
export class PublicServiceEngine {
  constructor(config = {}) {
    this.services = {
      healthcare: {
        name: 'Municipal Healthcare & Bio-Synthetics',
        allocation: config.services?.healthcare?.allocation ?? 80,
        capacity: 1200,
        efficiency: 0.85,
        satisfaction: 82,
      },
      education: {
        name: 'Civic Education & Technical Academies',
        allocation: config.services?.education?.allocation ?? 65,
        capacity: 1000,
        efficiency: 0.80,
        satisfaction: 78,
      },
      infrastructure: {
        name: 'Grid Logistics & Transit Infrastructure',
        allocation: config.services?.infrastructure?.allocation ?? 90,
        capacity: 1500,
        efficiency: 0.88,
        satisfaction: 85,
      },
      resources: {
        name: 'Public Utility & Strategic Buffers',
        allocation: config.services?.resources?.allocation ?? 50,
        capacity: 1400,
        efficiency: 0.82,
        satisfaction: 80,
      },
      emergency: {
        name: 'Civil Protection & Emergency Response',
        allocation: config.services?.emergency?.allocation ?? 45,
        capacity: 1500,
        efficiency: 0.90,
        satisfaction: 88,
      },
      ...(config.services || {}),
    };
  }

  /**
   * Set budget allocation for a specific service
   *
   * @param {string} serviceKey - 'healthcare' | 'education' | 'infrastructure' | 'resources' | 'emergency'
   * @param {number} amount
   */
  setAllocation(serviceKey, amount) {
    if (!this.services[serviceKey]) {
      throw new Error(`Service "${serviceKey}" does not exist`);
    }
    this.services[serviceKey].allocation = Math.max(0, Number(amount));
  }

  /**
   * Compute total public service operational costs per simulation tick
   * @returns {number}
   */
  getTotalBudgetExpenditure() {
    let total = 0;
    for (const s of Object.values(this.services)) {
      total += s.allocation;
    }
    return total;
  }

  /**
   * Pipeline update: Evaluates service fulfillment against population demand
   *
   * @param {import('../core/WorldState.js').WorldState} worldState
   * @param {number} delta
   * @param {Object} [policyModifiers={}]
   */
  update(worldState, delta, policyModifiers = {}) {
    const population = worldState.population?.total || 1000;
    const treasury = worldState.economy?.treasury || 50000;

    // Check if treasury has funds for public services
    const totalCost = this.getTotalBudgetExpenditure();
    const isFundingConstrained = treasury < totalCost * 5;

    for (const [key, s] of Object.entries(this.services)) {
      // Baseline required funding per capita
      const baselinePerCapita = 0.06;
      const targetFunding = population * baselinePerCapita;
      const fundingRatio = s.allocation / Math.max(10, targetFunding);

      // Efficiency scales with funding, penalized by treasury insolvency
      let eff = Math.min(1.0, 0.4 + (fundingRatio * 0.5));
      if (isFundingConstrained) eff *= 0.8;

      s.efficiency = Number(eff.toFixed(2));
      s.capacity = Math.round(s.allocation * 16 * s.efficiency);

      // Satisfaction score [0 - 100]
      const coverageRatio = Math.min(1.2, s.capacity / Math.max(1, population));
      const sat = Math.round(Math.min(100, coverageRatio * 85 * s.efficiency));
      s.satisfaction = sat;

      // Real consequences on population
      if (key === 'healthcare') {
        const healthImpact = (s.efficiency - 0.7) * 2 + (policyModifiers.healthDelta || 0) * 0.2;
        worldState.population.health = Math.max(10, Math.min(100, Math.round(worldState.population.health + healthImpact)));
      } else if (key === 'education') {
        worldState.population.education = Math.max(10, Math.min(100, Math.round((worldState.population.education || 75) * 0.98 + s.satisfaction * 0.02)));
      } else if (key === 'infrastructure') {
        // Boost building efficiency across the city
        const infraBoost = (s.efficiency - 0.5) * 0.05 + (policyModifiers.buildingEfficiencyDelta || 0);
        for (const building of worldState.getBuildings()) {
          building.efficiency = Math.max(0.5, Math.min(1.5, Number(((building.efficiency || 1.0) + infraBoost * 0.1).toFixed(3))));
        }
      }
    }
  }

  /**
   * Get composite public service satisfaction score
   * @returns {number} Value [0 - 100]
   */
  getOverallSatisfaction() {
    const list = Object.values(this.services);
    const sum = list.reduce((acc, s) => acc + s.satisfaction, 0);
    return Math.round(sum / list.length);
  }

  /**
   * Snapshot of all services for frontend
   */
  getPublicServicesSummary() {
    return Object.entries(this.services).map(([key, s]) => ({
      key,
      name: s.name,
      allocation: s.allocation,
      capacity: s.capacity,
      efficiency: s.efficiency,
      satisfaction: s.satisfaction,
    }));
  }
}

export default PublicServiceEngine;
