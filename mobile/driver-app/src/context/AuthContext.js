import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import driverApi from '../api/driverApi';

const AuthContext = createContext({
  isAuthenticated: false,
  user: null,
  token: null,
  initialize: () => {},
  login: async (_email, _password) => {},
  logout: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const isAuthenticated = !!user && !!token;

  const initialize = useCallback(async () => {
    // Ping để đánh thức BE (Render cold start)
    await driverApi.ping();
    return;
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await driverApi.login(email, password);
    if (res?.token) {
      setToken(res.token);
      setUser(res.user || { email, role: 'driver' });
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await driverApi.logout();
    } catch (_) {}
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ isAuthenticated, user, token, initialize, login, logout }),
    [isAuthenticated, user, token, initialize, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
