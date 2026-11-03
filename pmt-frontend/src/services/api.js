import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const resolveBackendUrl = (relativePath = '') => {
  if (!relativePath) return '';
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }
  if (API_BASE.startsWith('http://') || API_BASE.startsWith('https://')) {
    try {
      const parsed = new URL(API_BASE);
      return `${parsed.origin}${relativePath.startsWith('/') ? '' : '/'}${relativePath}`;
    } catch {
      return relativePath;
    }
  }
  return relativePath;
};

export const resolveWsUrl = (token = '') => {
  if (API_BASE.startsWith('http://') || API_BASE.startsWith('https://')) {
    try {
      const parsed = new URL(API_BASE);
      const wsProto = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${wsProto}//${parsed.host}/ws?token=${encodeURIComponent(token)}`;
    } catch {
      // Fallback below
    }
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws?token=${encodeURIComponent(token)}`;
};

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.startsWith('/login')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;