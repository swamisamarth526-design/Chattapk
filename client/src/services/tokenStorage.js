import { STORAGE_KEYS } from '../utils/constants';

export function getStoredToken() {
  try {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  } catch {
    return null;
  }
}

export function storeToken(token) {
  try {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  } catch {
    // Ignore storage failures and keep the session in memory for this tab.
  }
}

export function clearStoredToken() {
  try {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
  } catch {
    // Ignore storage failures during logout/session reset.
  }
}
