/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useEffect, useState } from 'react';
import * as authService from '../services/auth';
import {
  registerUnauthorizedHandler,
  setApiAuthToken,
} from '../services/api';
import {
  clearStoredToken,
  getStoredToken,
  storeToken,
} from '../services/tokenStorage';
import { extractApiMessage } from '../utils/errors';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [error, setError] = useState('');
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearAuth = useCallback(() => {
    clearStoredToken();
    setApiAuthToken(null);
    setToken(null);
    setUser(null);
  }, []);

  const persistSession = useCallback((nextToken, nextUser) => {
    storeToken(nextToken);
    setApiAuthToken(nextToken);
    setToken(nextToken);
    setUser(nextUser);
    setError('');
  }, []);

  const bootstrapAuth = useCallback(async () => {
    const storedToken = getStoredToken();

    if (!storedToken) {
      clearAuth();
      setIsBootstrapping(false);
      return;
    }

    try {
      setApiAuthToken(storedToken);
      setToken(storedToken);
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      setError('');
    } catch {
      clearAuth();
      setError('');
    } finally {
      setIsBootstrapping(false);
    }
  }, [clearAuth]);

  useEffect(() => {
    bootstrapAuth();
  }, [bootstrapAuth]);

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      clearAuth();
      setError('Your session expired. Please sign in again.');
    });

    return () => {
      registerUnauthorizedHandler(null);
    };
  }, [clearAuth]);

  const login = useCallback(
    async (credentials) => {
      try {
        setIsSubmitting(true);
        setError('');
        const { token: nextToken, user: nextUser } = await authService.loginUser(
          credentials
        );
        persistSession(nextToken, nextUser);
        return nextUser;
      } catch (loginError) {
        const message = extractApiMessage(
          loginError,
          'Unable to sign in right now.'
        );
        setError(message);
        throw loginError;
      } finally {
        setIsSubmitting(false);
      }
    },
    [persistSession]
  );

  const register = useCallback(
    async (userData) => {
      try {
        setIsSubmitting(true);
        setError('');
        const { token: nextToken, user: nextUser } = await authService.registerUser(
          userData
        );
        persistSession(nextToken, nextUser);
        return nextUser;
      } catch (registerError) {
        const message = extractApiMessage(
          registerError,
          'Unable to create your account.'
        );
        setError(message);
        throw registerError;
      } finally {
        setIsSubmitting(false);
      }
    },
    [persistSession]
  );

  const logout = useCallback(async () => {
    try {
      setIsSubmitting(true);
      setError('');

      if (getStoredToken()) {
        await authService.logoutUser();
      }
    } catch (logoutError) {
      console.error('Logout failed:', logoutError);
    } finally {
      clearAuth();
      setIsSubmitting(false);
    }
  }, [clearAuth]);

  const refreshUser = useCallback(async () => {
    const currentUser = await authService.getCurrentUser();
    setUser(currentUser);
    return currentUser;
  }, []);

  const value = {
    user,
    token,
    error,
    isAuthenticated: Boolean(token && user),
    isBootstrapping,
    isSubmitting,
    login,
    register,
    logout,
    refreshUser,
    clearAuth,
    setError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
