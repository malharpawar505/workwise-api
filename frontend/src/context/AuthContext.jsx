import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ww_token');
    const saved = localStorage.getItem('ww_user');
    if (token && saved) {
      try {
        setUser(JSON.parse(saved));
      } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('ww_token', data.token);
    localStorage.setItem('ww_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async (name, email, password, department) => {
    const { data } = await api.post('/auth/register', { name, email, password, department });
    localStorage.setItem('ww_token', data.token);
    localStorage.setItem('ww_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('ww_token');
    localStorage.removeItem('ww_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
