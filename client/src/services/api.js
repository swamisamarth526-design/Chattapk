import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';
import { clearStoredToken, getStoredToken } from './tokenStorage';

let unauthorizedHandler = null;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function setApiAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete api.defaults.headers.common.Authorization;
}

export function registerUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();

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
    const hasSessionToken = Boolean(getStoredToken() || error.config?.headers?.Authorization);

    if (error.response?.status === 401 && hasSessionToken) {
      clearStoredToken();
      setApiAuthToken(null);
      unauthorizedHandler?.();
    }

    return Promise.reject(error);
  }
);

export default api;
