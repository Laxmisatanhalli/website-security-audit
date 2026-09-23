import { createContext, useContext, useState, useCallback } from 'react';
import { authApi } from '../api/auth';

const AuthContext = createContext(null);

const STORAGE_KEY = 'scanner_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // The JWT itself lives in an httpOnly cookie we can't read from JS, so
    // we can't silently verify a session on page load. We persist just the
    // *display* info (id/username/role) in localStorage so a refresh
    // doesn't bounce a logged-in user back to /login; if the cookie is
    // actually expired, the first API call's 401 interceptor (see
    // api/client.js) will redirect to /login anyway.
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback(async (credentials) => {
    const { data } = await authApi.login(credentials);
    setUser(data.user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
    return data.user;
  }, []);

  const register = useCallback(async (details) => {
    const { data } = await authApi.register(details);
    setUser(data.user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
