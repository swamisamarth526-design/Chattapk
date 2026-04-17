import api from './api';

function normalizeAuthResponse(response) {
  const { token, user } = response.data.data;
  return { token, user };
}

export async function registerUser(userData) {
  const response = await api.post('/auth/register', userData);
  return normalizeAuthResponse(response);
}

export async function loginUser(credentials) {
  const response = await api.post('/auth/login', credentials);
  return normalizeAuthResponse(response);
}

export async function getCurrentUser() {
  const response = await api.get('/auth/me');
  return response.data.data;
}

export async function logoutUser() {
  await api.post('/auth/logout');
}
