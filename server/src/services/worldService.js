import { World } from '../models/World.js';
import { isValidMongoId } from '../utils/validators.js';

/**
 * Helper to generate default cities when a count or empty array is provided.
 * @param {number} count
 * @param {number} totalPopulation
 * @param {string} worldName
 * @returns {Array<Object>}
 */
export const generateDefaultCities = (count = 1, totalPopulation = 1000, worldName = 'World') => {
  const cityCount = Math.max(1, Math.min(20, count));
  const baseName = worldName.split('//')[0].trim() || 'Sector';
  const prefixes = ['Neo-', 'New ', 'Port ', 'Upper ', 'Lower ', 'Central ', 'Fort ', 'Nova '];
  const suffixes = ['Prime', 'Core', 'Station', 'Heights', 'Delta', 'Hub', 'District', 'Spire'];

  const cities = [];
  const capitalShare = cityCount === 1 ? 1.0 : 0.45;
  const remainingShare = 1.0 - capitalShare;
  const secondaryPopPerCity = cityCount > 1 ? Math.floor((totalPopulation * remainingShare) / (cityCount - 1)) : 0;

  for (let i = 0; i < cityCount; i++) {
    const isCapital = i === 0;
    const pop = isCapital 
      ? Math.floor(totalPopulation * capitalShare) 
      : (i === cityCount - 1 ? totalPopulation - cities.reduce((acc, c) => acc + c.population, 0) : secondaryPopPerCity);

    const prefix = prefixes[i % prefixes.length];
    const suffix = suffixes[i % suffixes.length];
    const cityName = isCapital ? `${baseName} Capital Prime` : `${prefix}${baseName} ${suffix}`;

    // Deterministic spatial scattering
    const angle = (i / cityCount) * Math.PI * 2;
    const distance = isCapital ? 0 : 25 + (i * 7) % 20;
    const x = Math.round(50 + Math.cos(angle) * distance);
    const y = Math.round(50 + Math.sin(angle) * distance);

    cities.push({
      name: cityName,
      population: Math.max(1, pop),
      isCapital,
      coordinates: { x, y },
      specialization: isCapital ? 'Government & Financial Hub' : (i % 2 === 0 ? 'Manufacturing & Logistics' : 'Research & Biosphere'),
    });
  }

  return cities;
};

export class WorldService {
  /**
   * Create a new simulation world.
   * @param {Object} worldData
   * @returns {Promise<World>}
   */
  async createWorld(worldData) {
    if (!worldData.name || typeof worldData.name !== 'string') {
      const error = new Error('World name is required and must be a string');
      error.name = 'ValidationError';
      error.status = 400;
      throw error;
    }

    const population = Number(worldData.population) || 1000;

    // Handle cities: array or numerical count
    let cities = [];
    if (Array.isArray(worldData.cities) && worldData.cities.length > 0) {
      cities = worldData.cities.map((city, idx) => ({
        name: city.name || `City-${idx + 1}`,
        population: Number(city.population) || Math.floor(population / worldData.cities.length),
        isCapital: city.isCapital || idx === 0,
        coordinates: city.coordinates || { x: 50, y: 50 },
        specialization: city.specialization || 'General Urban Matrix',
      }));
    } else {
      const cityCount = Number(worldData.cityCount || worldData.numberOfCities || 3);
      cities = generateDefaultCities(cityCount, population, worldData.name);
    }

    // Build payload conforming to World schema
    const payload = {
      name: worldData.name.trim(),
      description: worldData.description ? worldData.description.trim() : '',
      population,
      geography: {
        biome: worldData.geography?.biome || worldData.biome || 'Cybernetic Basin',
        terrain: worldData.geography?.terrain || 'Mixed Terraces & Plains',
        climate: worldData.geography?.climate || 'Regulated Microclimate',
        landArea: Number(worldData.geography?.landArea || 10000),
        waterPercentage: Number(worldData.geography?.waterPercentage || 30),
      },
      resources: {
        energy: Number(worldData.resources?.energy ?? 5000),
        minerals: Number(worldData.resources?.minerals ?? 2500),
        water: Number(worldData.resources?.water ?? 5000),
        agriculture: Number(worldData.resources?.agriculture ?? 3000),
        technology: Number(worldData.resources?.technology ?? 1000),
      },
      cities,
      economyConfiguration: {
        startingMoney: Number(worldData.economyConfiguration?.startingMoney ?? worldData.startingMoney ?? 500000),
        currencyName: worldData.economyConfiguration?.currencyName || 'Neural Credits',
        currencySymbol: worldData.economyConfiguration?.currencySymbol || 'NC',
        taxRate: Number(worldData.economyConfiguration?.taxRate ?? 0.15),
        industries: Array.isArray(worldData.economyConfiguration?.industries)
          ? worldData.economyConfiguration.industries
          : Array.isArray(worldData.industries)
          ? worldData.industries
          : ['Energy', 'Manufacturing', 'Advanced Technology'],
      },
      governmentConfiguration: {
        type: worldData.governmentConfiguration?.type || worldData.governmentType || 'Technocracy',
        stabilityIndex: Number(worldData.governmentConfiguration?.stabilityIndex ?? 85),
        corruptionIndex: Number(worldData.governmentConfiguration?.corruptionIndex ?? 10),
        regulatoryStrictness: Number(worldData.governmentConfiguration?.regulatoryStrictness ?? 60),
      },
      simulationSettings: {
        speed: Number(worldData.simulationSettings?.speed ?? worldData.simulationSpeed ?? 1),
        tickRate: Number(worldData.simulationSettings?.tickRate ?? worldData.tickRate ?? 10),
        startingDate: worldData.simulationSettings?.startingDate 
          ? new Date(worldData.simulationSettings.startingDate)
          : worldData.startingDate 
          ? new Date(worldData.startingDate) 
          : new Date('2085-01-01T00:00:00.000Z'),
        seed: Number(worldData.simulationSettings?.seed ?? worldData.seed ?? Math.floor(Math.random() * 90000000) + 10000000),
        currentTick: 0,
        status: 'initialized',
      },
    };

    const newWorld = new World(payload);
    return await newWorld.save();
  }

  /**
   * Retrieve all worlds.
   * @param {Object} [filter={}]
   * @returns {Promise<World[]>}
   */
  async getAllWorlds(filter = {}) {
    return await World.find(filter).sort({ createdAt: -1 });
  }

  /**
   * Retrieve single world by MongoDB ID.
   * @param {string} id
   * @returns {Promise<World|null>}
   */
  async getWorldById(id) {
    if (!isValidMongoId(id)) {
      const error = new Error(`Invalid World ID format: ${id}`);
      error.name = 'CastError';
      error.status = 400;
      throw error;
    }
    return await World.findById(id);
  }

  /**
   * Update an existing world.
   * @param {string} id
   * @param {Object} updateData
   * @returns {Promise<World|null>}
   */
  async updateWorld(id, updateData) {
    if (!isValidMongoId(id)) {
      const error = new Error(`Invalid World ID format: ${id}`);
      error.name = 'CastError';
      error.status = 400;
      throw error;
    }

    const updated = await World.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updated) {
      const error = new Error(`World with ID ${id} not found`);
      error.name = 'NotFoundError';
      error.status = 404;
      throw error;
    }

    return updated;
  }

  /**
   * Delete world by ID.
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async deleteWorld(id) {
    if (!isValidMongoId(id)) {
      const error = new Error(`Invalid World ID format: ${id}`);
      error.name = 'CastError';
      error.status = 400;
      throw error;
    }

    const result = await World.findByIdAndDelete(id);
    if (!result) {
      const error = new Error(`World with ID ${id} not found`);
      error.name = 'NotFoundError';
      error.status = 404;
      throw error;
    }

    return true;
  }
}

export const worldService = new WorldService();
export default worldService;
