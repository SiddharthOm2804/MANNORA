/**
 * AgentSystem executes autonomous individual agent logic:
 * needs progression, daily diurnal cycles (work, rest, social),
 * resource consumption, productivity contributions, and health/happiness state updates.
 */
export class AgentSystem {
  /**
   * Pipeline step: updates all active agents in the simulation world.
   * @param {import('../core/WorldState.js').WorldState} worldState
   * @param {number} delta
   * @param {import('../core/RandomEngine.js').RandomEngine} random
   * @param {Object} [clockInfo]
   */
  update(worldState, delta, random, clockInfo = {}) {
    const agents = worldState.getAgents();
    if (agents.length === 0) {
      return;
    }

    const currentHour = clockInfo.hour ?? 12;
    const isNight = currentHour >= 22 || currentHour < 6;
    const isWorkHours = currentHour >= 8 && currentHour < 18;

    const hasFood = worldState.resources.agriculture.current > 1;
    const hasWater = worldState.resources.water.current > 1;
    const hasEnergy = worldState.resources.energy.current > 1;

    let totalProductivityScore = 0;
    let totalAgentHappiness = 0;
    let totalAgentHealth = 0;

    for (const agent of agents) {
      const needs = agent.needs || { hunger: 0, rest: 100, social: 50, safety: 100, fulfillment: 50 };
      const state = agent.state || { status: 'active', health: 100, energy: 100, happiness: 100, wealth: 100 };
      const traits = agent.traits || { rationality: 0.5, ambition: 0.5, productivity: 0.5, adaptability: 0.5 };

      // 1. DIURNAL ROUTINE & REST
      if (isNight) {
        state.status = 'resting';
        needs.rest = Math.min(100, needs.rest + 8);
        state.energy = Math.min(100, state.energy + 6);
      } else if (isWorkHours) {
        state.status = 'working';
        needs.rest = Math.max(0, needs.rest - 2);
        state.energy = Math.max(10, state.energy - 2);
      } else {
        state.status = 'leisure';
        needs.rest = Math.max(0, needs.rest - 1);
        needs.social = Math.min(100, needs.social + 4);
      }

      // 2. HUNGER & METABOLISM
      needs.hunger = Math.min(100, (needs.hunger || 0) + 2);
      if (needs.hunger > 30 && hasFood && hasWater) {
        // Eat meal
        needs.hunger = Math.max(0, needs.hunger - 35);
        state.happiness = Math.min(100, state.happiness + 2);
      } else if (needs.hunger > 70) {
        // Malnourishment penalty
        state.health = Math.max(5, state.health - 3);
        state.happiness = Math.max(5, state.happiness - 5);
      }

      // 3. UTILITY & LIVING CONDITIONS IMPACT
      if (!hasEnergy) {
        state.happiness = Math.max(5, state.happiness - 2);
      }
      if (!hasWater) {
        state.health = Math.max(5, state.health - 4);
      }

      // 4. PRODUCTIVITY & EARNINGS
      const healthFactor = state.health / 100;
      const energyFactor = state.energy / 100;
      const traitFactor = traits.productivity || 0.5;
      const agentProductivity = (healthFactor * 0.4 + energyFactor * 0.3 + traitFactor * 0.3);

      if (state.status === 'working') {
        const wage = Number((10 * agentProductivity).toFixed(2));
        state.wealth = Number(((state.wealth || 0) + wage).toFixed(2));
        needs.fulfillment = Math.min(100, needs.fulfillment + 1);
        totalProductivityScore += agentProductivity;
      }

      // Clamp health & happiness
      state.health = Math.max(0, Math.min(100, state.health));
      state.happiness = Math.max(0, Math.min(100, state.happiness));

      totalAgentHealth += state.health;
      totalAgentHappiness += state.happiness;

      // Update agent in state
      worldState.updateAgent(agent.id, { needs, state });
    }

    // Reflect average agent happiness & health into world population if agents exist
    if (agents.length > 0) {
      const avgHappiness = Math.round(totalAgentHappiness / agents.length);
      const avgHealth = Math.round(totalAgentHealth / agents.length);
      worldState.population.happiness = Math.round((worldState.population.happiness * 0.7) + (avgHappiness * 0.3));
      worldState.population.health = Math.round((worldState.population.health * 0.7) + (avgHealth * 0.3));
    }
  }

  /**
   * Helper to instantiate a new agent with deterministic attributes
   * @param {string} id
   * @param {Object} [overrides]
   * @param {import('../core/RandomEngine.js').RandomEngine} [random]
   */
  static createAgent(id, overrides = {}, random = null) {
    const roles = ['citizen', 'engineer', 'technician', 'researcher', 'trader', 'administrator'];
    const role = overrides.role || (random ? random.choice(roles) : 'citizen');
    
    return {
      id,
      name: overrides.name || `Agent ${id.slice(-4)}`,
      role,
      coordinates: overrides.coordinates || {
        x: random ? random.nextInt(10, 90) : 50,
        y: random ? random.nextInt(10, 90) : 50,
      },
      state: {
        status: 'active',
        health: 100,
        energy: 100,
        happiness: 100,
        wealth: random ? random.nextInt(50, 500) : 100,
        ...(overrides.state || {}),
      },
      needs: {
        hunger: random ? random.nextInt(0, 30) : 10,
        rest: random ? random.nextInt(70, 100) : 90,
        social: random ? random.nextInt(40, 80) : 60,
        safety: 100,
        fulfillment: 50,
        ...(overrides.needs || {}),
      },
      traits: {
        rationality: random ? Number(random.range(0.3, 0.9).toFixed(2)) : 0.6,
        ambition: random ? Number(random.range(0.2, 0.9).toFixed(2)) : 0.5,
        productivity: random ? Number(random.range(0.4, 0.95).toFixed(2)) : 0.7,
        adaptability: random ? Number(random.range(0.3, 0.9).toFixed(2)) : 0.5,
        socialAffinity: random ? Number(random.range(0.2, 0.8).toFixed(2)) : 0.5,
        ...(overrides.traits || {}),
      },
      inventory: { ...(overrides.inventory || {}) },
      employerId: overrides.employerId || null,
      residenceId: overrides.residenceId || null,
    };
  }
}

export default AgentSystem;
