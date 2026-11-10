import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
  const configuredWsUrl = import.meta.env.VITE_WS_URL;
  let url;

  if (configuredWsUrl) {
    url = new URL(configuredWsUrl, window.location.origin);
  } else if (API_BASE.startsWith('http://') || API_BASE.startsWith('https://')) {
    const apiUrl = new URL(API_BASE);
    url = new URL('/ws', apiUrl.origin);
  } else {
    url = new URL('/ws', window.location.origin);
  }

  if (url.protocol === 'https:') url.protocol = 'wss:';
  if (url.protocol === 'http:') url.protocol = 'ws:';
  if (url.protocol !== 'ws:' && url.protocol !== 'wss:') {
    throw new Error('VITE_WS_URL must use ws:// or wss://');
  }

  url.searchParams.set('token', token);
  return url.toString();
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