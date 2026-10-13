/**
 * GoalSystem manages hierarchical and utility-driven citizen objectives.
 *
 * Categorizes goals into:
 * - Survival (Hunger, Exhaustion, Health)
 * - Economic (Work shifts, Job search, Wealth accumulation, Starting business, Purchasing supplies)
 * - Social (Building relationships, Community interaction)
 * - Growth (Skill improvement, Recreation, Upgrading living conditions)
 */
export class GoalSystem {
  /**
   * @param {Object} [config]
   * @param {Object} [config.activeGoal=null]
   * @param {Array<Object>} [config.goalHistory=[]]
   * @param {number} [config.maxHistory=15]
   */
  constructor(config = {}) {
    this.activeGoal = config.activeGoal ? structuredClone(config.activeGoal) : null;
    this.goalHistory = Array.isArray(config.goalHistory) ? structuredClone(config.goalHistory) : [];
    this.maxHistory = config.maxHistory || 15;
    this._nextGoalId = 1;
  }

  /**
   * Evaluate citizen state, homeostatic drives, personality traits, and world environment
   * to deterministically select or advance the citizen's active goal.
   *
   * @param {import('./Agent.js').Agent} agent
   * @param {Object} worldObservations
   * @param {Object} [clockInfo={}]
   * @returns {Object} Active goal
   */
  evaluate(agent, worldObservations, clockInfo = {}) {
    const currentHour = clockInfo.hour ?? 12;
    const isNight = currentHour >= 22 || currentHour < 6;
    const isWorkHours = currentHour >= 8 && currentHour < 18;

    const needs = agent.needs;
    const urgentNeeds = needs.getUrgentNeeds();
    const traits = agent.personalityTraits;
    const wealth = agent.wealth;
    const occupation = agent.occupation;
    const isEmployed = Boolean(agent.employerId) && occupation !== 'unemployed';

    // 1. SURVIVAL OVERRIDE: Starvation or Extreme Hunger
    if (needs.hunger >= 65) {
      if (!this.activeGoal || this.activeGoal.type !== 'SURVIVE_HUNGER') {
        this._setNewGoal({
          type: 'SURVIVE_HUNGER',
          category: 'survival',
          priority: 95,
          title: 'Obtain Food and Satiate Hunger',
          target: {
            type: agent.inventory?.food > 0 ? 'inventory' : 'market',
            buildingId: worldObservations.nearestMarket?.id || null,
            coordinates: worldObservations.nearestMarket?.coordinates || agent.location,
          },
          maxProgress: 1,
        });
      }
      return this.activeGoal;
    }

    // 2. SURVIVAL OVERRIDE: Exhaustion or Nighttime Rest
    if (needs.rest <= 25 || (isNight && needs.rest <= 65)) {
      if (!this.activeGoal || this.activeGoal.type !== 'SURVIVE_EXHAUSTION') {
        this._setNewGoal({
          type: 'SURVIVE_EXHAUSTION',
          category: 'survival',
          priority: 90,
          title: 'Return Home and Sleep',
          target: {
            type: 'residence',
            buildingId: agent.residenceId || worldObservations.nearestResidential?.id || null,
            coordinates: worldObservations.residenceCoordinates || agent.location,
          },
          maxProgress: 1,
        });
      }
      return this.activeGoal;
    }

    // If active goal is still a survival goal but the condition has cleared, complete it
    if (this.activeGoal && this.activeGoal.category === 'survival') {
      if (this.activeGoal.type === 'SURVIVE_HUNGER' && needs.hunger < 35) {
        this.completeCurrentGoal();
      } else if (this.activeGoal.type === 'SURVIVE_EXHAUSTION' && needs.rest > 75) {
        this.completeCurrentGoal();
      }
    }

    // 3. ECONOMIC: Work Shift (during work hours if employed)
    if (isWorkHours && isEmployed) {
      if (!this.activeGoal || this.activeGoal.type !== 'WORK_SHIFT') {
        this._setNewGoal({
          type: 'WORK_SHIFT',
          category: 'economic',
          priority: 75,
          title: `Perform Assigned Work as ${occupation}`,
          target: {
            type: 'workplace',
            buildingId: agent.employerId,
            coordinates: worldObservations.workplaceCoordinates || agent.location,
          },
          maxProgress: 8, // Standard 8-hour shift
        });
      }
      return this.activeGoal;
    }

    // 4. ECONOMIC: Unemployed Job Search
    if (!isEmployed && !isNight) {
      // Check if citizen qualifies and has ambition to start a business
      const canStartBusiness =
        wealth >= 800 &&
        traits.ambition >= 0.65 &&
        !agent.businessId &&
        worldObservations.availableCommercialLots?.length > 0;

      if (canStartBusiness && (!this.activeGoal || this.activeGoal.type !== 'START_BUSINESS')) {
        this._setNewGoal({
          type: 'START_BUSINESS',
          category: 'economic',
          priority: 80,
          title: 'Establish New Commercial Enterprise',
          target: {
            type: 'lot',
            buildingId: null,
            coordinates: worldObservations.availableCommercialLots[0] || agent.location,
          },
          maxProgress: 2,
        });
        return this.activeGoal;
      }

      if (!this.activeGoal || this.activeGoal.type !== 'SEARCH_JOB') {
        this._setNewGoal({
          type: 'SEARCH_JOB',
          category: 'economic',
          priority: 70,
          title: 'Seek Gainful Employment in City Matrix',
          target: {
            type: 'employer',
            buildingId: worldObservations.hiringBuildings?.[0]?.id || null,
            coordinates: worldObservations.hiringBuildings?.[0]?.coordinates || agent.location,
          },
          maxProgress: 1,
        });
        return this.activeGoal;
      }
    }

    // 5. SOCIAL: Social Affiliation & Interaction
    if (needs.social < 45 || (traits.socialAffinity >= 0.7 && !isNight && !isWorkHours)) {
      if (!this.activeGoal || this.activeGoal.type !== 'BUILD_RELATIONSHIPS') {
        const targetAgent = worldObservations.nearbyAgents?.[0] || null;
        this._setNewGoal({
          type: 'BUILD_RELATIONSHIPS',
          category: 'social',
          priority: 55,
          title: 'Engage in Social Dialogue and Mutual Bonding',
          target: {
            type: 'agent',
            id: targetAgent ? targetAgent.id : null,
            coordinates: targetAgent ? targetAgent.location : agent.location,
          },
          maxProgress: 1,
        });
        return this.activeGoal;
      }
    }

    // 6. SUPPLY RESTOCK: Low Food Inventory with Disposable Wealth
    if ((agent.inventory?.food || 0) < 1 && wealth >= 25 && !isNight) {
      if (!this.activeGoal || this.activeGoal.type !== 'PURCHASE_SUPPLIES') {
        this._setNewGoal({
          type: 'PURCHASE_SUPPLIES',
          category: 'economic',
          priority: 50,
          title: 'Procure Food and Essential Supplies from Market',
          target: {
            type: 'market',
            buildingId: worldObservations.nearestMarket?.id || null,
            coordinates: worldObservations.nearestMarket?.coordinates || agent.location,
          },
          maxProgress: 1,
        });
        return this.activeGoal;
      }
    }

    // 7. WEALTH / SAVINGS: High wealth and frugal trait
    if (wealth >= 600 && traits.frugality >= 0.6) {
      if (!this.activeGoal || this.activeGoal.type !== 'ACCUMULATE_WEALTH') {
        this._setNewGoal({
          type: 'ACCUMULATE_WEALTH',
          category: 'economic',
          priority: 40,
          title: 'Deposit Surplus Wealth into Long-Term Reserves',
          target: { type: 'wealth', amount: wealth },
          maxProgress: 1,
        });
        return this.activeGoal;
      }
    }

    // 8. GROWTH / LEISURE: Off-work relaxation or cultural recreation
    if (!this.activeGoal) {
      this._setNewGoal({
        type: 'REST_AND_RECREATE',
        category: 'growth',
        priority: 30,
        title: 'Enjoy Civic Amenities and Rebalance Mental State',
        target: {
          type: 'venue',
          buildingId: worldObservations.nearestCommercial?.id || null,
          coordinates: worldObservations.nearestCommercial?.coordinates || agent.location,
        },
        maxProgress: 2,
      });
    }

    return this.activeGoal;
  }

  /**
   * Internal helper to transition to a new active goal and archive prior if active.
   * @private
   */
  _setNewGoal(goalData, clockInfo = {}) {
    const tick = clockInfo.tick ?? 0;
    if (this.activeGoal && this.activeGoal.type !== goalData.type) {
      this.abandonCurrentGoal('Replaced by higher priority objective', clockInfo);
    }

    this.activeGoal = {
      id: `goal_t${tick}_${this._nextGoalId++}`,
      type: goalData.type,
      category: goalData.category || 'general',
      priority: goalData.priority || 50,
      title: goalData.title || goalData.type,
      target: goalData.target || {},
      progress: 0,
      maxProgress: goalData.maxProgress || 1,
      status: 'active',
      startedTick: tick,
    };
  }

  /**
   * Advance progress of current active goal.
   * @param {number} [amount=1]
   * @param {Object} [clockInfo={}]
   * @returns {boolean} True if goal was completed by this advance
   */
  advanceProgress(amount = 1, clockInfo = {}) {
    if (!this.activeGoal || this.activeGoal.status !== 'active') {
      return false;
    }

    this.activeGoal.progress += amount;
    if (this.activeGoal.progress >= this.activeGoal.maxProgress) {
      this.completeCurrentGoal(clockInfo);
      return true;
    }
    return false;
  }

  /**
   * Complete active goal and log to history.
   * @param {Object} [clockInfo={}]
   * @returns {Object|null} Completed goal record
   */
  completeCurrentGoal(clockInfo = {}) {
    if (!this.activeGoal) return null;

    const completed = {
      ...this.activeGoal,
      status: 'completed',
      progress: this.activeGoal.maxProgress,
      completedTick: clockInfo.tick ?? (this.activeGoal.startedTick || 0),
    };

    this.goalHistory.unshift(completed);
    if (this.goalHistory.length > this.maxHistory) {
      this.goalHistory.pop();
    }

    this.activeGoal = null;
    return completed;
  }

  /**
   * Abandon current goal with an explanatory reason.
   * @param {string} [reason='Preempted']
   * @param {Object} [clockInfo={}]
   * @returns {Object|null}
   */
  abandonCurrentGoal(reason = 'Preempted', clockInfo = {}) {
    if (!this.activeGoal) return null;

    const abandoned = {
      ...this.activeGoal,
      status: 'abandoned',
      reason,
      abandonedTick: clockInfo.tick ?? (this.activeGoal.startedTick || 0),
    };

    this.goalHistory.unshift(abandoned);
    if (this.goalHistory.length > this.maxHistory) {
      this.goalHistory.pop();
    }

    this.activeGoal = null;
    return abandoned;
  }

  /**
   * Retrieve current active goal.
   * @returns {Object|null}
   */
  getActiveGoal() {
    return this.activeGoal;
  }

  /**
   * Retrieve recent goal history.
   * @param {number} [count=5]
   * @returns {Array<Object>}
   */
  getGoalHistory(count = 5) {
    return this.goalHistory.slice(0, count);
  }

  /**
   * Serialize GoalSystem to plain object.
   * @returns {Object}
   */
  serialize() {
    return {
      activeGoal: this.activeGoal ? structuredClone(this.activeGoal) : null,
      goalHistory: structuredClone(this.goalHistory),
      maxHistory: this.maxHistory,
    };
  }

  /**
   * Restore GoalSystem from plain object.
   * @param {Object} data
   * @returns {GoalSystem}
   */
  static deserialize(data = {}) {
    return new GoalSystem(data);
  }
}

export default GoalSystem;
