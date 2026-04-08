import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);
const DEMO_ROLE = 'Admin';

const normalizeUser = (user) => (
  user
    ? {
        ...user,
        role: DEMO_ROLE,
      }
    : null
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const hydrate = async () => {
      const storedToken = localStorage.getItem('filemap_token');
      if (storedToken) {
        try {
          const data = await authService.getMe();
          setToken(storedToken);
          setUser(normalizeUser(data.user));
        } catch (error) {
          console.error("Failed to rehydrate auth:", error);
          localStorage.removeItem('filemap_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    hydrate();
  }, []);

  const register = useCallback(async (name, email, password) => {
    const data = await authService.register(name, email, password);
    setToken(data.token);
    setUser(normalizeUser(data.user));
    localStorage.setItem('filemap_token', data.token);
    return DEMO_ROLE;
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authService.login(email, password);
    setToken(data.token);
    setUser(normalizeUser(data.user));
    localStorage.setItem('filemap_token', data.token);
    return DEMO_ROLE;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('filemap_token');
    window.location.href = '/login';
  }, []);

  const value = {
    user,
    token,
    login,
    register,
    logout,
    isAuthenticated: !!token,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
