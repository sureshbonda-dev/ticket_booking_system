import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../features/auth/authApi.js';

const AuthContext = createContext(null);
const TOKEN_KEY = 'cinema.accessToken';
const USER_KEY = 'cinema.user';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) || '');
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(USER_KEY) || 'null'); } catch { return null; }
  });

  const saveSession = useCallback((auth) => {
    sessionStorage.setItem(TOKEN_KEY, auth.accessToken);
    sessionStorage.setItem(USER_KEY, JSON.stringify(auth.user));
    setToken(auth.accessToken);
    setUser(auth.user);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem('cinema.pendingCheckout');
    setToken('');
    setUser(null);
  }, []);

  const login = useCallback(async (credentials) => saveSession(await authApi.login(credentials)), [saveSession]);
  const register = useCallback(async (details) => saveSession(await authApi.register(details)), [saveSession]);

  useEffect(() => {
    const onExpired = () => logout();
    window.addEventListener('cinema:session-expired', onExpired);
    return () => window.removeEventListener('cinema:session-expired', onExpired);
  }, [logout]);

  const value = useMemo(() => ({ token, user, login, register, logout, setUser }), [token, user, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
