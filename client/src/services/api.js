/**
 * services/api.js — Axios instance with JWT interceptor and all API methods.
 */
import axios from 'axios';

// Base URL — uses Vite proxy in development
const API = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if not already on auth pages
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth APIs ──────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  getProfile: () => API.get('/auth/profile'),
};

// ─── Prediction APIs ────────────────────────────────────────────────────────
export const predictionAPI = {
  create: (data) => API.post('/predict', data),
  getAll: (params) => API.get('/predictions', { params }),
  getById: (id) => API.get(`/predictions/${id}`),
  delete: (id) => API.delete(`/predictions/${id}`),
  getDashboard: () => API.get('/dashboard'),
};

export default API;
