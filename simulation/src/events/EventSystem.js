/**
 * EventSystem manages random, conditional, and scheduled simulation events.
 * Handles event lifecycles, active duration ticking, and deterministic event triggers.
 */
export class EventSystem {
  /**
   * @param {Object} [options]
   * @param {number} [options.eventProbability=0.05] - Base probability of random event per tick
   */
  constructor(options = {}) {
    this.eventProbability = options.eventProbability ?? 0.05;

    // Standard event catalog
    this.catalog = [
      {
        type: 'SOLAR_STORM',
        title: 'High-Atmosphere Solar Storm',
        category: 'environmental',
        severity: 2,
        duration: 8,
        description: 'Solar flares disrupt grid relays, reducing energy production by 25%.',
        modifiers: { energyProductionMultiplier: 0.75, happinessDelta: -2 },
      },
      {
        type: 'ECONOMIC_BOOM',
        title: 'Venture Capital Tech Surge',
        category: 'economic',
        severity: 1,
        duration: 12,
        description: 'Foreign capital investment accelerates commercial tech output and GDP.',
        modifiers: { techProductionMultiplier: 1.5, gdpMultiplier: 1.15, happinessDelta: 4 },
      },
      {
        type: 'WATER_PURIFIER_BREAKTHROUGH',
        title: 'Nanofiltration Discovery',
        category: 'technological',
        severity: 1,
        duration: 15,
        description: 'New water recycling protocols boost water generation efficiency by 30%.',
        modifiers: { waterProductionMultiplier: 1.3, healthDelta: 3 },
      },
      {
        type: 'HEATWAVE',
        title: 'Thermal Spike Anomaly',
        category: 'environmental',
        severity: 2,
        duration: 6,
        description: 'Extreme temperatures increase municipal water and energy consumption by 40%.',
        modifiers: { energyConsumptionMultiplier: 1.4, waterConsumptionMultiplier: 1.4, happinessDelta: -5 },
      },
      {
        type: 'CIVIC_FESTIVAL',
        title: 'Neo-Solstice City Celebration',
        category: 'cultural',
        severity: 1,
        duration: 5,
        description: 'Citizens gather in central squares, boosting municipal happiness and social cohesion.',
        modifiers: { happinessDelta: 8, stabilityDelta: 5 },
      },
      {
        type: 'SUPPLY_CHAIN_BOTTLENECK',
        title: 'Sub-Orbital Logistics Delay',
        category: 'economic',
        severity: 2,
        duration: 10,
        description: 'Component shortages constrain manufacturing and raw materials output.',
        modifiers: { rawMaterialsProductionMultiplier: 0.7, inflationDelta: 0.02 },
      },
    ];
  }

  /**
   * Pipeline step: processes scheduled events, updates active events, and triggers random events.
   * @param {import('../core/WorldState.js').WorldState} worldState
   * @param {number} delta
   * @param {import('../core/RandomEngine.js').RandomEngine} random
   * @param {Object} [clockInfo]
   */
  update(worldState, delta, random, clockInfo = {}) {
    const currentTick = worldState.tick;

    // 1. Process scheduled events that match current tick
    const scheduled = worldState.events.scheduled || [];
    const remainingScheduled = [];

    for (const item of scheduled) {
      if (item.triggerTick <= currentTick) {
        this.triggerEvent(worldState, item);
      } else {
        remainingScheduled.push(item);
      }
    }
    worldState.events.scheduled = remainingScheduled;

    // 2. Tick active events & decrement remaining durations
    const activeEvents = worldState.events.active || [];
    const retainedActive = [];

    for (const evt of activeEvents) {
      evt.remainingTicks -= 1;
      if (evt.remainingTicks > 0) {
        retainedActive.push(evt);
      } else {
        // Event expired: record in event log
        worldState.logEvent({
          id: evt.id,
          type: evt.type,
          title: evt.title,
          severity: evt.severity,
          outcome: 'EXPIRED_NATURALLY',
          startedAtTick: evt.startedAtTick,
          resolvedAtTick: currentTick,
        });
      }
    }
    worldState.events.active = retainedActive;

    // 3. Deterministic chance to trigger a new random event if none or few active
    if (activeEvents.length < 3 && random.nextFloat() < this.eventProbability) {
      const template = random.choice(this.catalog);
      if (template) {
        const eventId = `evt_${template.type.toLowerCase()}_${currentTick}_${random.nextInt(100, 999)}`;
        const newEvent = {
          id: eventId,
          type: template.type,
          title: template.title,
          category: template.category,
          severity: template.severity,
          description: template.description,
          totalDuration: template.duration,
          remainingTicks: template.duration,
          startedAtTick: currentTick,
          modifiers: { ...template.modifiers },
        };
        worldState.addActiveEvent(newEvent);
      }
    }
  }

  /**
   * Trigger and register an event into active world state
   * @param {import('../core/WorldState.js').WorldState} worldState
   * @param {Object} eventData
   */
  triggerEvent(worldState, eventData) {
    const eventId = eventData.id || `evt_${eventData.type || 'generic'}_${worldState.tick}`;
    const fullEvent = {
      id: eventId,
      type: eventData.type || 'CUSTOM_EVENT',
      title: eventData.title || 'Civic Event',
      category: eventData.category || 'general',
      severity: eventData.severity || 1,
      description: eventData.description || '',
      totalDuration: eventData.duration || 10,
      remainingTicks: eventData.duration || 10,
      startedAtTick: worldState.tick,
      modifiers: eventData.modifiers || {},
    };
    worldState.addActiveEvent(fullEvent);
    return fullEvent;
  }

  /**
   * Aggregate all active event modifiers for other subsystems to consume
   * @param {import('../core/WorldState.js').WorldState} worldState
   * @returns {Object} Combined modifiers
   */
  static getAggregateModifiers(worldState) {
    const active = worldState.events?.active || [];
    const aggregated = {
      energyProductionMultiplier: 1.0,
      waterProductionMultiplier: 1.0,
      mineralsProductionMultiplier: 1.0,
      agricultureProductionMultiplier: 1.0,
      techProductionMultiplier: 1.0,
      rawMaterialsProductionMultiplier: 1.0,
      energyConsumptionMultiplier: 1.0,
      waterConsumptionMultiplier: 1.0,
      agricultureConsumptionMultiplier: 1.0,
      gdpMultiplier: 1.0,
      happinessDelta: 0,
      healthDelta: 0,
      stabilityDelta: 0,
      inflationDelta: 0,
    };

    for (const evt of active) {
      if (!evt.modifiers) continue;
      for (const [key, val] of Object.entries(evt.modifiers)) {
        if (key.endsWith('Multiplier')) {
          aggregated[key] = (aggregated[key] || 1.0) * val;
        } else if (key.endsWith('Delta')) {
          aggregated[key] = (aggregated[key] || 0) + val;
        }
      }
    }

    return aggregated;
  }
}

export default EventSystem;
