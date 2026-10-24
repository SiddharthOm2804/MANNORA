/**
 * DecisionEngine executes deterministic, rule-based and utility-driven
 * action selection for individual citizens.
 *
 * Evaluates agent homeostatic needs, active goals, personality traits,
 * economic conditions, and environmental proximity.
 *
 * Enforces purposeful movement (no random meaningless wandering)
 * and operates strictly without LLM in the core tick loop.
 */
export class DecisionEngine {
  /**
   * Action Types supported by DecisionEngine:
   */
  static ACTIONS = {
    WORK: 'work',
    EAT: 'eat',
    SLEEP: 'sleep',
    TRAVEL: 'travel',
    SHOP: 'shop',
    SEARCH_JOB: 'search_job',
    START_BUSINESS: 'start_business',
    INTERACT: 'interact',
    SAVE_MONEY: 'save_money',
    SPEND_MONEY: 'spend_money',
    REST: 'rest',
  };

  /**
   * Select the optimal deterministic action for an agent given its current state
   * and world observations.
   *
   * @param {import('./Agent.js').Agent} agent
   * @param {Object} worldObservations
   * @param {import('../core/RandomEngine.js').RandomEngine} [random]
   * @returns {{ type: string, target?: Object, payload?: Object, reason: string }}
   */
  selectAction(agent, worldObservations, random = null) {
    const {
      currentHour = 12,
      isNight = false,
      isWorkHours = false,
      workplaceCoordinates = null,
      residenceCoordinates = null,
      nearestMarket = null,
      nearestCommercial = null,
      hiringBuildings = [],
      nearbyAgents = [],
      marketFoodPrice = 5,
    } = worldObservations;

    const needs = agent.needs;
    const goals = agent.goals;
    const activeGoal = goals.getActiveGoal();
    const traits = agent.personalityTraits;
    const location = agent.location;
    const wealth = agent.wealth;
    const foodInInventory = agent.inventory?.food || 0;
    const isEmployed = Boolean(agent.employerId) && agent.occupation !== 'unemployed';

    // Helper: calculate distance to a coordinates object
    const distanceTo = (target) => {
      if (!target || typeof target.x !== 'number' || typeof target.y !== 'number') {
        return Infinity;
      }
      return Math.hypot(target.x - location.x, target.y - location.y);
    };

    // Threshold distance to consider agent "at" a venue
    const ARRIVAL_DISTANCE = 2.0;

    // =========================================================================
    // 1. SURVIVAL: STARVATION (Hunger >= 65)
    // =========================================================================
    if (needs.hunger >= 65) {
      // If citizen has food in personal inventory, eat immediately
      if (foodInInventory > 0) {
        return {
          type: DecisionEngine.ACTIONS.EAT,
          payload: { source: 'inventory' },
          reason: 'Severe hunger: consuming food from inventory',
        };
      }

      // If at market or restaurant, buy meal and eat
      const marketTarget = nearestMarket?.coordinates || null;
      if (nearestMarket && distanceTo(marketTarget) <= ARRIVAL_DISTANCE) {
        if (wealth >= marketFoodPrice) {
          return {
            type: DecisionEngine.ACTIONS.SHOP,
            target: nearestMarket,
            payload: { item: 'food', quantity: 1, cost: marketFoodPrice },
            reason: 'At market: purchasing food to relieve severe hunger',
          };
        }
      }

      // Otherwise, travel purposefully to nearest market / food vendor
      if (marketTarget && distanceTo(marketTarget) > ARRIVAL_DISTANCE) {
        return {
          type: DecisionEngine.ACTIONS.TRAVEL,
          target: {
            x: marketTarget.x,
            y: marketTarget.y,
            buildingId: nearestMarket.id,
            label: 'Marketplace',
          },
          reason: 'Traveling to market to obtain sustenance',
        };
      }
    }

    // =========================================================================
    // 2. SURVIVAL: EXHAUSTION OR NIGHT REST (Rest <= 25 OR (isNight AND Rest <= 65))
    // =========================================================================
    if (needs.rest <= 25 || (isNight && needs.rest <= 65)) {
      const homeCoords = residenceCoordinates || { x: 50, y: 50 };
      const atHome = distanceTo(homeCoords) <= ARRIVAL_DISTANCE;

      if (atHome || !agent.residenceId) {
        return {
          type: DecisionEngine.ACTIONS.SLEEP,
          payload: { hours: 1 },
          reason: isNight ? 'Night diurnal cycle: sleeping at residence' : 'Exhaustion: resting to restore stamina',
        };
      }

      // Purposeful travel to home residence
      return {
        type: DecisionEngine.ACTIONS.TRAVEL,
        target: {
          x: homeCoords.x,
          y: homeCoords.y,
          buildingId: agent.residenceId,
          label: 'Residence',
        },
        reason: 'Traveling home to rest',
      };
    }

    // =========================================================================
    // 3. ECONOMIC: WORK SHIFT (Employed & Daytime Work Hours)
    // =========================================================================
    if (isWorkHours && isEmployed && needs.rest > 20) {
      const workCoords = workplaceCoordinates || { x: 50, y: 50 };
      const atWorkplace = distanceTo(workCoords) <= ARRIVAL_DISTANCE;

      if (atWorkplace) {
        return {
          type: DecisionEngine.ACTIONS.WORK,
          target: { buildingId: agent.employerId },
          payload: { productivity: traits.productivity, wage: agent.income },
          reason: `Performing occupational duties as ${agent.occupation}`,
        };
      }

      // Purposeful commute to workplace
      return {
        type: DecisionEngine.ACTIONS.TRAVEL,
        target: {
          x: workCoords.x,
          y: workCoords.y,
          buildingId: agent.employerId,
          label: 'Workplace',
        },
        reason: `Commuting to workplace at ${agent.employerId}`,
      };
    }

    // =========================================================================
    // 4. ECONOMIC: STARTING A BUSINESS (Ambitious, Wealthy, Unemployed / Entrepreneurial)
    // =========================================================================
    const isAmbitiousEntrepreneur =
      wealth >= 800 &&
      traits.ambition >= 0.65 &&
      !agent.businessId &&
      worldObservations.availableCommercialLots?.length > 0;

    if (isAmbitiousEntrepreneur && !isNight) {
      const lotTarget = worldObservations.availableCommercialLots[0];
      const atLot = distanceTo(lotTarget) <= ARRIVAL_DISTANCE;

      if (atLot) {
        return {
          type: DecisionEngine.ACTIONS.START_BUSINESS,
          target: { coordinates: lotTarget },
          payload: { capital: 500, businessType: 'commercial' },
          reason: 'High ambition and capital: founding new commercial venture',
        };
      }

      return {
        type: DecisionEngine.ACTIONS.TRAVEL,
        target: {
          x: lotTarget.x,
          y: lotTarget.y,
          label: 'Commercial Development Lot',
        },
        reason: 'Traveling to commercial parcel to found new business',
      };
    }

    // =========================================================================
    // 5. ECONOMIC: SEARCHING FOR A JOB (Unemployed during daytime)
    // =========================================================================
    if (!isEmployed && !isNight && hiringBuildings.length > 0) {
      const bestHiring = hiringBuildings[0];
      const jobCoords = bestHiring.coordinates;
      const atJobSite = distanceTo(jobCoords) <= ARRIVAL_DISTANCE;

      if (atJobSite) {
        return {
          type: DecisionEngine.ACTIONS.SEARCH_JOB,
          target: bestHiring,
          payload: { skills: agent.skills },
          reason: `Applying for employment vacancy at ${bestHiring.name || bestHiring.id}`,
        };
      }

      return {
        type: DecisionEngine.ACTIONS.TRAVEL,
        target: {
          x: jobCoords.x,
          y: jobCoords.y,
          buildingId: bestHiring.id,
          label: bestHiring.name || 'Employment Office',
        },
        reason: 'Traveling to facility to apply for open vacancy',
      };
    }

    // =========================================================================
    // 6. ECONOMIC: SHOPPING & GROCERIES (Low food in pantry & has wealth)
    // =========================================================================
    if (foodInInventory < 1 && wealth >= marketFoodPrice * 2 && !isNight && nearestMarket) {
      const marketCoords = nearestMarket.coordinates;
      const atMarket = distanceTo(marketCoords) <= ARRIVAL_DISTANCE;

      if (atMarket) {
        return {
          type: DecisionEngine.ACTIONS.SHOP,
          target: nearestMarket,
          payload: { item: 'food', quantity: 2, cost: marketFoodPrice * 2 },
          reason: 'At market: restocking domestic food provisions',
        };
      }

      return {
        type: DecisionEngine.ACTIONS.TRAVEL,
        target: {
          x: marketCoords.x,
          y: marketCoords.y,
          buildingId: nearestMarket.id,
          label: 'Marketplace',
        },
        reason: 'Traveling to marketplace to purchase provisions',
      };
    }

    if ((needs.social < 55 || traits.socialAffinity >= 0.6) && !isNight) {
      // Prioritize partners who have existing family/friend ties or shared community
      const sortedPartners = [...nearbyAgents]
        .filter((a) => a.id !== agent.id)
        .sort((a, b) => {
          const relA = agent.relationships?.get?.(a.id);
          const relB = agent.relationships?.get?.(b.id);
          const strengthA = relA ? (relA.strength ?? 0.5) : 0.1;
          const strengthB = relB ? (relB.strength ?? 0.5) : 0.1;
          return strengthB - strengthA;
        });

      // Find nearby agent within immediate interaction radius
      const nearbyPartner = sortedPartners.find((a) => distanceTo(a.location) <= 4.0);

      if (nearbyPartner) {
        const bond = agent.relationships?.get?.(nearbyPartner.id);
        return {
          type: DecisionEngine.ACTIONS.INTERACT,
          target: { agentId: nearbyPartner.id, name: nearbyPartner.name, role: bond?.role },
          payload: { partnerTraits: nearbyPartner.personalityTraits, bondStrength: bond?.strength },
          reason: `Engaging in dialogue with ${bond?.type || 'citizen'} ${nearbyPartner.name || nearbyPartner.id}`,
        };
      }

      // If partner is further away, travel toward close friend or community member
      const candidatePartner = sortedPartners[0];
      if (candidatePartner && distanceTo(candidatePartner.location) <= 18.0) {
        return {
          type: DecisionEngine.ACTIONS.TRAVEL,
          target: {
            x: candidatePartner.location.x,
            y: candidatePartner.location.y,
            label: candidatePartner.name || 'Citizen Meeting',
          },
          reason: `Walking toward citizen ${candidatePartner.name || candidatePartner.id} to socialize`,
        };
      }
    }

    // =========================================================================
    // 8. FINANCIAL: SAVE MONEY (High wealth and frugal personality)
    // =========================================================================
    if (wealth >= 500 && traits.frugality >= 0.55 && !isNight) {
      return {
        type: DecisionEngine.ACTIONS.SAVE_MONEY,
        payload: { amount: Math.round(wealth * 0.1) },
        reason: 'Frugal trait: allocating disposable wealth to security reserves',
      };
    }

    // =========================================================================
    // 9. RECREATION / FINANCIAL: SPEND MONEY (Low fulfillment and disposable wealth)
    // =========================================================================
    if (needs.fulfillment < 50 && wealth >= 150 && traits.frugality < 0.65 && !isNight && nearestCommercial) {
      const commCoords = nearestCommercial.coordinates;
      const atCommercial = distanceTo(commCoords) <= ARRIVAL_DISTANCE;

      if (atCommercial) {
        return {
          type: DecisionEngine.ACTIONS.SPEND_MONEY,
          target: nearestCommercial,
          payload: { amount: 30, service: 'entertainment' },
          reason: 'At commercial venue: patronizing recreation to elevate fulfillment',
        };
      }

      return {
        type: DecisionEngine.ACTIONS.TRAVEL,
        target: {
          x: commCoords.x,
          y: commCoords.y,
          buildingId: nearestCommercial.id,
          label: 'Commercial Plaza',
        },
        reason: 'Traveling to commercial plaza for recreation',
      };
    }

    // =========================================================================
    // 10. DEFAULT / HOMEOSTATIC RELAXATION (Resting at Home or Leisure)
    // =========================================================================
    const homeCoords = residenceCoordinates || { x: 50, y: 50 };
    const atHome = distanceTo(homeCoords) <= ARRIVAL_DISTANCE;

    if (!atHome && !isWorkHours) {
      return {
        type: DecisionEngine.ACTIONS.TRAVEL,
        target: {
          x: homeCoords.x,
          y: homeCoords.y,
          buildingId: agent.residenceId,
          label: 'Home',
        },
        reason: 'Returning home for evening leisure',
      };
    }

    return {
      type: DecisionEngine.ACTIONS.REST,
      payload: { duration: 1 },
      reason: 'Home leisure: relaxing and maintaining equilibrium',
    };
  }
}

export default DecisionEngine;
