import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 8000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (!['get', 'head', 'options'].includes((config.method || 'get').toLowerCase())) {
    const csrf = document.cookie.split('; ').find((entry) => entry.startsWith('mannora_csrf='))?.split('=').slice(1).join('=');
    if (csrf) config.headers['X-CSRF-Token'] = decodeURIComponent(csrf);
  }
  return config;
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
