/**
 * Helper to generate preview cities when creating a world.
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
