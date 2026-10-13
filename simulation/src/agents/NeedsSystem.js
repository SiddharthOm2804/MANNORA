/**
 * NeedsSystem manages the physiological and psychological homeostatic drives
 * of individual citizens (hunger, rest, social, safety, fulfillment, health).
 *
 * Implements realistic decay rates, urgency curves, threshold triggers,
 * and satisfaction dynamics.
 */
export class NeedsSystem {
  /**
   * @param {Object} [initialNeeds]
   * @param {number} [initialNeeds.hunger=10] - 0 (satiated) to 100 (starving)
   * @param {number} [initialNeeds.rest=90] - 100 (fully rested) to 0 (exhausted)
   * @param {number} [initialNeeds.social=70] - 100 (socially fulfilled) to 0 (isolated)
   * @param {number} [initialNeeds.safety=85] - 100 (secure) to 0 (in peril)
   * @param {number} [initialNeeds.fulfillment=60] - 100 (fulfilled) to 0 (demoralized)
   * @param {number} [initialNeeds.health=100] - 100 (peak health) to 0 (critical)
   */
  constructor(initialNeeds = {}) {
    this.hunger = initialNeeds.hunger ?? 10;
    this.rest = initialNeeds.rest ?? 90;
    this.social = initialNeeds.social ?? 70;
    this.safety = initialNeeds.safety ?? 85;
    this.fulfillment = initialNeeds.fulfillment ?? 60;
    this.health = initialNeeds.health ?? 100;
  }

  /**
   * Natural decay and metabolism progression per simulation tick/hour.
   * @param {number} [delta=1.0] - Time factor
   * @param {boolean} [isSleeping=false] - Whether citizen is sleeping
   * @param {Object} [environment={}] - Environmental context (shelter, crime, etc.)
   */
  decay(delta = 1.0, isSleeping = false, environment = {}) {
    if (isSleeping) {
      // During sleep: hunger increases slowly, rest recovers rapidly
      this.hunger = Math.min(100, this.hunger + 0.8 * delta);
      this.rest = Math.min(100, this.rest + 18.0 * delta);
      this.health = Math.min(100, this.health + 1.2 * delta);
      this.social = Math.max(0, this.social - 0.3 * delta);
      this.fulfillment = Math.max(0, this.fulfillment - 0.2 * delta);
    } else {
      // While awake: hunger increases, rest and social decay
      this.hunger = Math.min(100, this.hunger + 2.2 * delta);
      this.rest = Math.max(0, this.rest - 2.5 * delta);
      this.social = Math.max(0, this.social - 1.5 * delta);
      this.fulfillment = Math.max(0, this.fulfillment - 0.8 * delta);
    }

    // Safety is influenced by shelter and city stability
    const hasHome = environment.hasHome ?? true;
    const cityStability = environment.cityStability ?? 85;
    const baseSafetyTarget = (hasHome ? 75 : 35) + (cityStability * 0.25);
    this.safety += (baseSafetyTarget - this.safety) * 0.1 * delta;
    this.safety = Math.max(0, Math.min(100, this.safety));

    // Health penalties when starving or exhausted
    if (this.hunger > 75) {
      const faminePenalty = ((this.hunger - 75) / 25) * 4.0 * delta;
      this.health = Math.max(0, this.health - faminePenalty);
    }

    if (this.rest < 15) {
      const exhaustionPenalty = ((15 - this.rest) / 15) * 3.0 * delta;
      this.health = Math.max(0, this.health - exhaustionPenalty);
    }

    // Normalizing clamp
    this._clampAll();
  }

  /**
   * Satisfy a specific need by a positive delta amount.
   * @param {string} needKey
   * @param {number} amount
   */
  satisfy(needKey, amount) {
    if (amount <= 0) return;

    switch (needKey) {
      case 'hunger':
        // For hunger, satisfaction means reducing the hunger level
        this.hunger = Math.max(0, this.hunger - amount);
        break;
      case 'rest':
        this.rest = Math.min(100, this.rest + amount);
        break;
      case 'social':
        this.social = Math.min(100, this.social + amount);
        break;
      case 'safety':
        this.safety = Math.min(100, this.safety + amount);
        break;
      case 'fulfillment':
        this.fulfillment = Math.min(100, this.fulfillment + amount);
        break;
      case 'health':
        this.health = Math.min(100, this.health + amount);
        break;
      default:
        break;
    }
    this._clampAll();
  }

  /**
   * Identify needs currently breaching critical comfort or survival thresholds.
   * Returns list sorted by highest urgency.
   * @returns {Array<{ need: string, urgency: number, isCritical: boolean }>}
   */
  getUrgentNeeds() {
    const list = [];

    // Hunger urgency (0 to 1)
    if (this.hunger > 45) {
      const urgency = Math.min(1.0, (this.hunger - 40) / 60);
      list.push({ need: 'hunger', urgency, isCritical: this.hunger >= 75 });
    }

    // Rest urgency (0 to 1)
    if (this.rest < 40) {
      const urgency = Math.min(1.0, (40 - this.rest) / 40);
      list.push({ need: 'rest', urgency, isCritical: this.rest <= 20 });
    }

    // Health emergency
    if (this.health < 40) {
      const urgency = Math.min(1.0, (40 - this.health) / 40);
      list.push({ need: 'health', urgency, isCritical: this.health <= 40 });
    }

    // Social urgency
    if (this.social < 35) {
      const urgency = Math.min(1.0, (35 - this.social) / 35);
      list.push({ need: 'social', urgency, isCritical: false });
    }

    // Fulfillment urgency
    if (this.fulfillment < 30) {
      const urgency = Math.min(1.0, (30 - this.fulfillment) / 30);
      list.push({ need: 'fulfillment', urgency, isCritical: false });
    }

    // Safety urgency
    if (this.safety < 30) {
      const urgency = Math.min(1.0, (30 - this.safety) / 30);
      list.push({ need: 'safety', urgency, isCritical: this.safety <= 15 });
    }

    return list.sort((a, b) => b.urgency - a.urgency);
  }

  /**
   * Calculate normalized urgency score for a specific need [0, 1].
   * @param {string} needKey
   * @returns {number}
   */
  getUrgencyScore(needKey) {
    switch (needKey) {
      case 'hunger':
        return Math.max(0, Math.min(1, this.hunger / 100));
      case 'rest':
        return Math.max(0, Math.min(1, (100 - this.rest) / 100));
      case 'social':
        return Math.max(0, Math.min(1, (100 - this.social) / 100));
      case 'safety':
        return Math.max(0, Math.min(1, (100 - this.safety) / 100));
      case 'fulfillment':
        return Math.max(0, Math.min(1, (100 - this.fulfillment) / 100));
      case 'health':
        return Math.max(0, Math.min(1, (100 - this.health) / 100));
      default:
        return 0;
    }
  }

  /**
   * Overall physiological and psychological wellbeing index [0, 100].
   * @returns {number}
   */
  getOverallWellbeing() {
    const hungerScore = 100 - this.hunger;
    const weighted =
      this.health * 0.28 +
      hungerScore * 0.24 +
      this.rest * 0.20 +
      this.social * 0.12 +
      this.safety * 0.08 +
      this.fulfillment * 0.08;
    return Math.round(Math.max(0, Math.min(100, weighted)));
  }

  /**
   * Clamp all needs to [0, 100] range.
   * @private
   */
  _clampAll() {
    this.hunger = Math.max(0, Math.min(100, Number(this.hunger.toFixed(2))));
    this.rest = Math.max(0, Math.min(100, Number(this.rest.toFixed(2))));
    this.social = Math.max(0, Math.min(100, Number(this.social.toFixed(2))));
    this.safety = Math.max(0, Math.min(100, Number(this.safety.toFixed(2))));
    this.fulfillment = Math.max(0, Math.min(100, Number(this.fulfillment.toFixed(2))));
    this.health = Math.max(0, Math.min(100, Number(this.health.toFixed(2))));
  }

  /**
   * Serialize needs to plain object.
   * @returns {Object}
   */
  serialize() {
    return {
      hunger: this.hunger,
      rest: this.rest,
      social: this.social,
      safety: this.safety,
      fulfillment: this.fulfillment,
      health: this.health,
    };
  }

  /**
   * Restore from plain object.
   * @param {Object} data
   * @returns {NeedsSystem}
   */
  static deserialize(data = {}) {
    return new NeedsSystem(data);
  }
}

export default NeedsSystem;
