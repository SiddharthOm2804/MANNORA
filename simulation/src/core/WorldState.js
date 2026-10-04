/**
 * WorldState encapsulates the state snapshot of the simulation world at a specific tick.
 * Supports deep cloning, serialization, and deterministic state tracking.
 */
export class WorldState {
  /**
   * @param {Object} [data]
   * @param {number} [data.tick=0]
   * @param {{ width: number, height: number }} [data.dimensions]
   * @param {Object} [data.metrics]
   * @param {Map<string, Object>|Object} [data.entities]
   * @param {Object} [data.metadata]
   */
  constructor(data = {}) {
    this.tick = data.tick || 0;
    this.dimensions = data.dimensions || { width: 100, height: 100 };
    this.metrics = {
      population: 0,
      energy: 1000,
      treasury: 10000,
      happiness: 100,
      health: 100,
      ...(data.metrics || {}),
    };
    this.metadata = {
      name: 'Neural City Alpha',
      seed: 123456789,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(data.metadata || {}),
    };

    // Store entities by ID
    this.entities = new Map();
    if (data.entities) {
      if (data.entities instanceof Map) {
        data.entities.forEach((val, key) => this.entities.set(key, structuredClone(val)));
      } else if (typeof data.entities === 'object') {
        Object.entries(data.entities).forEach(([key, val]) => {
          this.entities.set(key, structuredClone(val));
        });
      }
    }
  }

  /**
   * Get an entity by ID
   * @param {string} id
   * @returns {Object|null}
   */
  getEntity(id) {
    return this.entities.get(id) || null;
  }

  /**
   * Set or update an entity
   * @param {string} id
   * @param {Object} entityData
   */
  setEntity(id, entityData) {
    this.entities.set(id, { id, ...entityData });
    this.metadata.updatedAt = new Date().toISOString();
  }

  /**
   * Remove an entity by ID
   * @param {string} id
   * @returns {boolean}
   */
  removeEntity(id) {
    return this.entities.delete(id);
  }

  /**
   * Returns all entities as an array
   * @returns {Object[]}
   */
  getEntities() {
    return Array.from(this.entities.values());
  }

  /**
   * Returns count of active entities
   * @returns {number}
   */
  getEntityCount() {
    return this.entities.size;
  }

  /**
   * Update city / world metrics
   * @param {Object} partialMetrics
   */
  updateMetrics(partialMetrics) {
    this.metrics = {
      ...this.metrics,
      ...partialMetrics,
    };
    this.metadata.updatedAt = new Date().toISOString();
  }

  /**
   * Retrieve current metrics
   * @returns {Object}
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Deep clone this WorldState for immutable stepping or snapshotting
   * @returns {WorldState}
   */
  clone() {
    const serialized = this.serialize();
    return WorldState.deserialize(serialized);
  }

  /**
   * Serialize state into a plain JSON-safe object
   * @returns {Object}
   */
  serialize() {
    const entitiesObj = {};
    for (const [id, entity] of this.entities.entries()) {
      entitiesObj[id] = entity;
    }

    return {
      tick: this.tick,
      dimensions: { ...this.dimensions },
      metrics: { ...this.metrics },
      metadata: { ...this.metadata },
      entities: entitiesObj,
    };
  }

  /**
   * Factory method to deserialize plain object back into WorldState instance
   * @param {Object} data
   * @returns {WorldState}
   */
  static deserialize(data) {
    return new WorldState(data);
  }
}

export default WorldState;
