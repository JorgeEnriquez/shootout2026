import { createContext, useContext, useState, useEffect } from 'react';
import { api, setToken, clearToken } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.getMe()
        .then(data => setUser(data.user))
        .catch(() => { clearToken(); setUser(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const register = async (email, password) => {
    const data = await api.register(email, password);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const login = async (email, password) => {
    const data = await api.login(email, password);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const updateDisplayName = async (displayName) => {
    const data = await api.setDisplayName(displayName);
    setUser(prev => ({ ...prev, display_name: displayName, displayName, first_login_complete: 1, firstLoginComplete: 1 }));
    return data;
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  const refreshUser = async () => {
    const data = await api.getMe();
    setUser(data.user);
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, updateDisplayName, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
