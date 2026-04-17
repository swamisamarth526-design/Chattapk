function trimTrailingSlash(value) {
  return value.replace(/\/+$/, '');
}

function normalizeApiBaseUrl(value) {
  const normalizedValue = trimTrailingSlash(value);
  return normalizedValue.endsWith('/api')
    ? normalizedValue
    : `${normalizedValue}/api`;
}

// API Configuration
const defaultApiBase = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL
  : import.meta.env.PROD
  ? '/api'
  : 'http://localhost:5000/api';

export const API_BASE_URL = normalizeApiBaseUrl(defaultApiBase);
export const SOCKET_URL = trimTrailingSlash(
  import.meta.env.VITE_SOCKET_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000')
);

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'chatx_token',
  CONVERSATIONS: 'chatx_conversations',
};

// Message Constants
export const MESSAGE_LIMITS = {
  MIN_LENGTH: 1,
  MAX_LENGTH: 5000,
};

// Pagination
export const PAGINATION = {
  MESSAGES_PER_PAGE: 30,
  USERS_PER_PAGE: 20,
  CONVERSATIONS_PER_PAGE: 20,
};

// Connection Status
export const CONNECTION_STATUS = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  ERROR: 'error',
};

// Loading States
export const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
};

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  CHAT: '/chat',
  CHAT_CONVERSATION: '/chat/:conversationId',
};

// UI
export const SHOW_LOADING_DELAY = 300; // ms before showing loading state
export const TOAST_DURATION = 3000; // ms
