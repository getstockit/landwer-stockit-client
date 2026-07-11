import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AuthUser } from '../types';
import { authApi } from '../api';

interface AuthContextType {
  user: AuthUser | null;
  loginWithUser: (userId: string, pin: string) => Promise<void>;
  register: (name: string, pin: string) => Promise<{ pending: boolean }>;
  registerManager: (name: string, pin: string, bootstrapCode?: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ldw_token');
    const stored = localStorage.getItem('ldw_user');
    if (token && stored) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp && payload.exp * 1000 > Date.now()) {
          setUser(JSON.parse(stored));
        } else {
          localStorage.removeItem('ldw_token');
          localStorage.removeItem('ldw_user');
        }
      } catch {
        localStorage.removeItem('ldw_token');
        localStorage.removeItem('ldw_user');
      }
    }
    setIsLoading(false);
  }, []);

  const persist = (token: string, userData: AuthUser) => {
    localStorage.setItem('ldw_token', token);
    localStorage.setItem('ldw_user', JSON.stringify(userData));
    setUser(userData);
  };

  const loginWithUser = async (userId: string, pin: string) => {
    const res = await authApi.login(userId, pin);
    persist(res.data.token, res.data.user);
  };

  const register = async (name: string, pin: string) => {
    const res = await authApi.register(name, pin);
    if (res.data.pending) return { pending: true };
    persist(res.data.token, res.data.user);
    return { pending: false };
  };

  const registerManager = async (name: string, pin: string, bootstrapCode?: string) => {
    const res = await authApi.registerManager(name, pin, bootstrapCode);
    persist(res.data.token, res.data.user);
  };

  const logout = () => {
    localStorage.removeItem('ldw_token');
    localStorage.removeItem('ldw_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loginWithUser, register, registerManager, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
