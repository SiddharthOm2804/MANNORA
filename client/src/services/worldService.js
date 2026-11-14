import api from './api';

/**
 * Helper to generate preview cities when creating a world.
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

/**
 * World Service - Client-side interface to /api/worlds endpoints.
 */
export const worldService = {
  /**
   * Create a new civilization world.
   * @param {Object} worldData
   */
  async createWorld(worldData) {
    try {
      const response = await api.post('/worlds', worldData);
      return {
        success: true,
        data: response.data?.data,
        message: response.data?.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to create world',
      };
    }
  },

  /**
   * Fetch all worlds.
   */
  async getAllWorlds() {
    try {
      const response = await api.get('/worlds');
      return {
        success: true,
        data: response.data?.data || [],
        count: response.data?.count || 0,
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || error.message || 'Failed to retrieve worlds',
      };
    }
  },

  /**
   * Fetch a single world by ID.
   * @param {string} id
   */
  async getWorldById(id) {
    try {
      const response = await api.get(`/worlds/${id}`);
      return {
        success: true,
        data: response.data?.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to load world',
      };
    }
  },

  /**
   * Update world configuration.
   * @param {string} id
   * @param {Object} updateData
   */
  async updateWorld(id, updateData) {
    try {
      const response = await api.patch(`/worlds/${id}`, updateData);
      return {
        success: true,
        data: response.data?.data,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to update world',
      };
    }
  },

  /**
   * Inject a simulation event manually into a running world.
   * @param {string} worldId
   * @param {Object} eventData
   */
  async injectEvent(worldId, eventData) {
    try {
      const response = await api.post(`/worlds/${worldId}/inject-event`, eventData);
      return {
        success: true,
        data: response.data?.data,
        message: response.data?.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to inject event',
      };
    }
  },

  /**
   * Time Machine API Methods (Phase 12)
   */
  async captureSnapshot(worldId, options = {}) {
    try {
      const response = await api.post(`/worlds/${worldId}/snapshots`, options);
      return { success: true, data: response.data?.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },

  async restoreSnapshot(worldId, snapshotId) {
    try {
      const response = await api.post(`/worlds/${worldId}/snapshots/${snapshotId}/restore`);
      return { success: true, data: response.data?.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },

  async rewindSimulation(worldId, targetTick) {
    try {
      const response = await api.post(`/worlds/${worldId}/rewind`, { targetTick });
      return { success: true, data: response.data?.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },

  async jumpToDay(worldId, day) {
    try {
      const response = await api.post(`/worlds/${worldId}/jump-to-day`, { day });
      return { success: true, data: response.data?.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },

  async createBranch(worldId, branchOptions) {
    try {
      const response = await api.post(`/worlds/${worldId}/branches`, branchOptions);
      return { success: true, data: response.data?.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },

  async runComparison(worldId, comparisonParams) {
    try {
      const response = await api.post(`/worlds/${worldId}/compare`, comparisonParams);
      return { success: true, data: response.data?.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },

  // Phase 13 Experiment Lab Services
  async runExperiment(worldId, experimentSpec) {
    try {
      const endpoint = worldId ? `/worlds/${worldId}/experiments` : `/worlds/experiments/run`;
      const response = await api.post(endpoint, experimentSpec);
      return { success: true, data: response.data?.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },

  async listExperiments() {
    try {
      const response = await api.get('/worlds/experiments/all');
      return { success: true, data: response.data?.data || [] };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message, data: [] };
    }
  },

  async getExperiment(expId) {
    try {
      const response = await api.get(`/worlds/experiments/${expId}`);
      return { success: true, data: response.data?.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },

  async compareExperiments(experimentIds) {
    try {
      const response = await api.post('/worlds/experiments/compare', { experimentIds });
      return { success: true, data: response.data?.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },

  /**
   * Delete world by ID.
   * @param {string} id
   */
  async deleteWorld(id) {
    try {
      const response = await api.delete(`/worlds/${id}`);
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to delete world',
      };
    }
  },
};

export default worldService;
