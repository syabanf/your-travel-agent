import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const AuthContext = createContext();
const SESSION_KEY = 'mora_session';

const readSession = () => {
  try { return localStorage.getItem(SESSION_KEY) === '1'; } catch { return false; }
};

// Local auth: the mock client resolves a demo user, and a lightweight
// localStorage "session" gates the app behind the splash/login flow.
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(readSession());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setUser(await base44.auth.me());
      } catch (e) {
        console.error('Auth check failed:', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = (profile = {}) => {
    try {
      localStorage.setItem(SESSION_KEY, '1');
      if (profile.name) localStorage.setItem('mora_user_name', profile.name);
      if (profile.email) localStorage.setItem('mora_user_email', profile.email);
    } catch { /* ignore */ }
    setIsAuthenticated(true);
  };

  const logout = () => {
    try {
      localStorage.removeItem(SESSION_KEY);
      // Don't leave the previous person's name greeting the next one.
      localStorage.removeItem('mora_user_name');
      localStorage.removeItem('mora_user_email');
    } catch { /* ignore */ }
    setIsAuthenticated(false);
  };

  const value = {
    user,
    isAuthenticated,
    login,
    logout,
    // backward-compat aliases used by existing screens
    isLoading,
    isLoadingAuth: isLoading,
    isLoadingPublicSettings: false,
    authError: null,
    appPublicSettings: { id: 'local', public_settings: {} },
    navigateToLogin: () => { if (typeof window !== 'undefined') window.location.href = `${import.meta.env.BASE_URL}login`; },
    checkAppState: () => {},
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
