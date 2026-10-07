import { WorldState } from '@neural-city/simulation';

/**
 * WorldStateAdapter acts as the anti-corruption layer / conversion bridge
 * between persisted MongoDB World documents and the in-memory @neural-city/simulation WorldState.
 */
export class WorldStateAdapter {
  /**
   * Converts a MongoDB World document or plain object into a deterministic in-memory WorldState instance.
   * @param {Object} worldDoc - Mongoose World document or plain POJO
   * @returns {WorldState}
   */
  static fromMongoWorld(worldDoc) {
    if (!worldDoc) {
      throw new Error('World document is required for state conversion');
    }

    // Support both Mongoose document (.toObject()) and plain JS objects
    const raw = typeof worldDoc.toObject === 'function' ? worldDoc.toObject() : worldDoc;

    if (!raw.name || typeof raw.name !== 'string') {
      throw new Error('Invalid World data: missing or malformed "name"');
    }

    const worldId = raw._id ? String(raw._id) : (raw.id ? String(raw.id) : null);
    const population = typeof raw.population === 'number' ? raw.population : 1000;

    // Determine spatial dimensions based on land area or default grid
    const landArea = raw.geography?.landArea || 10000;
    const gridDimension = Math.max(50, Math.min(500, Math.round(Math.sqrt(landArea))));
    const dimensions = {
      width: gridDimension,
      height: gridDimension,
    };

    // Extract resources & economic parameters
    const metrics = {
      population,
      energy: Number(raw.resources?.energy ?? 5000),
      minerals: Number(raw.resources?.minerals ?? 2500),
      water: Number(raw.resources?.water ?? 5000),
      agriculture: Number(raw.resources?.agriculture ?? 3000),
      technology: Number(raw.resources?.technology ?? 1000),
      treasury: Number(raw.economyConfiguration?.startingMoney ?? 500000),
      taxRate: Number(raw.economyConfiguration?.taxRate ?? 0.15),
      stability: Number(raw.governmentConfiguration?.stabilityIndex ?? 85),
      corruption: Number(raw.governmentConfiguration?.corruptionIndex ?? 10),
      regulatoryStrictness: Number(raw.governmentConfiguration?.regulatoryStrictness ?? 60),
      happiness: 100,
      health: 100,
    };

    // Extract metadata
    const metadata = {
      worldId,
      name: raw.name,
      seed: Number(raw.simulationSettings?.seed || 123456789),
      startingDate: raw.simulationSettings?.startingDate 
        ? new Date(raw.simulationSettings.startingDate).toISOString() 
        : new Date('2085-01-01T00:00:00.000Z').toISOString(),
      speed: Number(raw.simulationSettings?.speed || 1),
      tickRate: Number(raw.simulationSettings?.tickRate || 10),
      status: raw.simulationSettings?.status || 'initialized',
      biome: raw.geography?.biome || 'Cybernetic Basin',
      governmentType: raw.governmentConfiguration?.type || 'Technocracy',
      currencyName: raw.economyConfiguration?.currencyName || 'Neural Credits',
      currencySymbol: raw.economyConfiguration?.currencySymbol || 'NC',
      createdAt: raw.createdAt ? new Date(raw.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: raw.updatedAt ? new Date(raw.updatedAt).toISOString() : new Date().toISOString(),
    };

    // Convert populated cities into simulation entities
    const entities = {};
    if (Array.isArray(raw.cities) && raw.cities.length > 0) {
      for (let i = 0; i < raw.cities.length; i++) {
        const city = raw.cities[i];
        const entityId = city._id ? String(city._id) : `city_${i + 1}`;
        entities[entityId] = {
          id: entityId,
          type: 'city',
          name: city.name || `City ${i + 1}`,
          population: Number(city.population) || 0,
          isCapital: Boolean(city.isCapital),
          coordinates: city.coordinates || { x: 50, y: 50 },
          specialization: city.specialization || 'General Urban Matrix',
        };
      }
    }

    const initialTick = Number(raw.simulationSettings?.currentTick || 0);

    return new WorldState({
      tick: initialTick,
      dimensions,
      metrics,
      metadata,
      entities,
    });
  }

  /**
   * Extract checkpoint updates from in-memory WorldState to persist back to MongoDB.
   * @param {WorldState} worldState
   * @returns {Object} MongoDB update payload
   */
  static toMongoCheckpoint(worldState) {
    if (!worldState || typeof worldState.getMetrics !== 'function') {
      throw new Error('Valid WorldState instance required for checkpoint conversion');
    }

    const metrics = worldState.getMetrics();
    const tick = worldState.tick;

    return {
      'simulationSettings.currentTick': tick,
      'resources.energy': metrics.energy,
      'resources.minerals': metrics.minerals,
      'resources.water': metrics.water,
      'resources.agriculture': metrics.agriculture,
      'resources.technology': metrics.technology,
      'economyConfiguration.startingMoney': metrics.treasury,
      'governmentConfiguration.stabilityIndex': metrics.stability,
      'governmentConfiguration.corruptionIndex': metrics.corruption,
      updatedAt: new Date(),
    };
  }
}

export default WorldStateAdapter;
