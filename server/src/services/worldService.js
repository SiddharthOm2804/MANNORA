import { World } from '../models/World.js';
import { isValidMongoId } from '../utils/validators.js';
import { cacheManager } from './cacheManager.js';

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
  const spitiPlaces = ['Spiti Vally', 'Kaza', 'Tabo', 'Dhankar', 'Kibber', 'Langza'];

  const cities = [];
  const capitalShare = cityCount === 1 ? 1.0 : 0.45;
  const remainingShare = 1.0 - capitalShare;
  const secondaryPopPerCity = cityCount > 1 ? Math.floor((totalPopulation * remainingShare) / (cityCount - 1)) : 0;

  for (let i = 0; i < cityCount; i++) {
    const isCapital = i === 0;
    const pop = isCapital 
      ? Math.floor(totalPopulation * capitalShare) 
      : (i === cityCount - 1 ? totalPopulation - cities.reduce((acc, c) => acc + c.population, 0) : secondaryPopPerCity);

    const isSpitiCity = baseName.toLowerCase().includes('spiti');
    const cityName = isSpitiCity
      ? spitiPlaces[i % spitiPlaces.length]
      : isCapital ? `${baseName} Town Centre` : `${baseName} Area ${i + 1}`;

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
      specialization: isCapital ? 'Council and local shops' : (i % 2 === 0 ? 'Farming and transport' : 'Schools and health care'),
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
  async createWorld(worldData, ownerId) {
    if (!worldData || typeof worldData !== 'object' || Array.isArray(worldData)) {
      const error = new Error('World payload must be a JSON object'); error.status = 400; throw error;
    }
    if (!worldData.name || typeof worldData.name !== 'string') {
      const error = new Error('World name is required and must be a string');
      error.name = 'ValidationError';
      error.status = 400;
      throw error;
    }
    if (worldData.name.trim().length < 3 || worldData.name.trim().length > 100) {
      const error = new Error('World name must be between 3 and 100 characters'); error.status = 400; throw error;
    }
    if (worldData.description != null && (typeof worldData.description !== 'string' || worldData.description.length > 1000)) {
      const error = new Error('World description must be a string of at most 1000 characters'); error.status = 400; throw error;
    }
    const requestedPopulation = worldData.population == null ? 1000 : Number(worldData.population);
    if (!Number.isFinite(requestedPopulation) || requestedPopulation < 1 || requestedPopulation > 10_000_000) {
      const error = new Error('Population must be a number between 1 and 10000000'); error.status = 400; throw error;
    }

    const population = requestedPopulation;

    // Handle cities: array or numerical count
    let cities = [];
    if (Array.isArray(worldData.cities) && worldData.cities.length > 0) {
      if (worldData.cities.length > 20 || worldData.cities.some((city) => !city || typeof city !== 'object' || Array.isArray(city))) {
        const error = new Error('Cities must be an array of at most 20 city objects'); error.status = 400; throw error;
      }
      cities = worldData.cities.map((city, idx) => ({
        name: typeof city.name === 'string' && city.name.trim() ? city.name.trim().slice(0, 100) : `City-${idx + 1}`,
        population: Number(city.population) || Math.floor(population / worldData.cities.length),
        isCapital: city.isCapital || idx === 0,
        coordinates: city.coordinates || { x: 50, y: 50 },
        specialization: city.specialization || 'General Urban Matrix',
      }));
    } else {
      const cityCount = Number(worldData.cityCount || worldData.numberOfCities || 3);
      cities = generateDefaultCities(cityCount, population, worldData.name);
    }

    // Keep user-provided city records in the finite map with distinct centre points.
    const occupied = [];
    const fallbackLots = [8, 24, 40, 60, 76, 92].flatMap((x) => [8, 24, 40, 60, 76, 92].map((y) => ({ x, y })));
    cities = cities.map((city) => {
      let point = city.coordinates;
      const valid = point && Number.isFinite(Number(point.x)) && Number.isFinite(Number(point.y)) && Number(point.x) >= 4 && Number(point.x) <= 96 && Number(point.y) >= 4 && Number(point.y) <= 96;
      if (!valid || occupied.some((other) => Math.hypot(other.x - Number(point.x), other.y - Number(point.y)) < 14)) {
        point = fallbackLots.find((lot) => !occupied.some((other) => Math.hypot(other.x - lot.x, other.y - lot.y) < 14)) || { x: 50, y: 50 };
      }
      const normalized = { x: Number(point.x), y: Number(point.y) };
      occupied.push(normalized);
      return { ...city, coordinates: normalized };
    });

    // Build payload conforming to World schema
    const payload = {
      ownerId,
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
        currencyName: worldData.economyConfiguration?.currencyName || 'Indian Rupees',
        currencySymbol: worldData.economyConfiguration?.currencySymbol || '₹',
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
  async getAllWorlds(ownerId) {
    return await World.find({ $or: [{ ownerId }, { 'members.userId': ownerId }] }).sort({ createdAt: -1 }).limit(100).lean();
  }

  /**
   * Retrieve single world by MongoDB ID with caching.
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

    // Try fast cache first
    const cached = await cacheManager.get(`world:${id}`);
    if (cached) {
      return cached;
    }

    const world = await World.findById(id);
    if (world) {
      // Cache for 60 seconds
      await cacheManager.set(`world:${id}`, world, 60);
    }
    return world;
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

    if (!updateData || typeof updateData !== 'object' || Array.isArray(updateData)) {
      const error = new Error('World update must be a JSON object'); error.status = 400; throw error;
    }
    const allowed = new Set(['name', 'description', 'population', 'geography', 'resources', 'cities', 'economyConfiguration', 'governmentConfiguration', 'simulationSettings']);
    const keys = Object.keys(updateData);
    if (!keys.length || keys.some((key) => !allowed.has(key))) {
      const error = new Error('World update contains unsupported fields'); error.status = 400; throw error;
    }
    if (updateData.name !== undefined && (typeof updateData.name !== 'string' || updateData.name.trim().length < 3 || updateData.name.trim().length > 100)) {
      const error = new Error('World name must be between 3 and 100 characters'); error.status = 400; throw error;
    }
    if (updateData.population !== undefined && (!Number.isFinite(Number(updateData.population)) || Number(updateData.population) < 1 || Number(updateData.population) > 10_000_000)) {
      const error = new Error('Population must be a number between 1 and 10000000'); error.status = 400; throw error;
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

    await cacheManager.del(`world:${id}`);
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

    await cacheManager.del(`world:${id}`);

    return true;
  }
}

export const worldService = new WorldService();
export default worldService;
