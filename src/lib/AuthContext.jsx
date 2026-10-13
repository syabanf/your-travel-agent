import React, { createContext, useState, useContext, useEffect } from 'react';
import { backend } from '@/api/backend';

const AuthContext = createContext();
const SESSION_KEY = 'ich_session';

const GUEST_KEY = 'ich_guest';
const readGuest = () => {
  try { return localStorage.getItem(GUEST_KEY) === '1'; } catch { return false; }
};

const readSession = () => {
  try { return localStorage.getItem(SESSION_KEY) === '1'; } catch { return false; }
};

// Local auth: the mock client resolves a demo user, and a lightweight
// localStorage "session" gates the app behind the splash/login flow.
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(readSession());
  // A guest browses the catalog without member content: no prices, no trips.
  const [isGuest, setIsGuest] = useState(readGuest());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setUser(await backend.auth.me());
      } catch (e) {
        console.error('Auth check failed:', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // `profile` may carry the account's details (phone, city, ...); they are
  // kept so forms can prefill them.
  const login = ({ name, email, ...details } = {}) => {
    const guest = name === 'Guest';
    try {
      localStorage.setItem(SESSION_KEY, '1');
      if (guest) localStorage.setItem(GUEST_KEY, '1'); else localStorage.removeItem(GUEST_KEY);
      if (name) localStorage.setItem('ich_user_name', name);
      if (email) localStorage.setItem('ich_user_email', email);
      localStorage.setItem('ich_user_profile', JSON.stringify(guest ? {} : details));
    } catch { /* ignore */ }
    setIsAuthenticated(true);
    setIsGuest(guest);
    backend.auth.me().then(setUser).catch(() => {});
  };

  const logout = () => {
    try {
      localStorage.removeItem(SESSION_KEY);
      // Don't leave the previous person's name greeting the next one.
      localStorage.removeItem('ich_user_name');
      localStorage.removeItem('ich_user_email');
      localStorage.removeItem('ich_user_profile');
      localStorage.removeItem(GUEST_KEY);
    } catch { /* ignore */ }
    setIsAuthenticated(false);
    setIsGuest(false);
  };

  const value = {
    user,
    isAuthenticated,
    isGuest,
    login,
    logout,
    isLoading,
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
