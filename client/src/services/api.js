import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Fetch server & database health from GET /api/health
 */
export const getHealth = async () => {
  try {
    const response = await api.get('/health');
    return {
      success: true,
      data: response.data,
      status: response.status,
    };
  } catch (error) {
    if (error.response) {
      return {
        success: false,
        data: error.response.data,
        status: error.response.status,
        message: error.response.data?.message || 'Server returned an error',
      };
    }
    return {
      success: false,
      data: null,
      status: 0,
      message: error.message || 'Cannot reach API server',
    };
  }
};

export default api;
