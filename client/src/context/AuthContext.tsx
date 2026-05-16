import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, User } from '../lib/api';

interface AuthContextType {
  user: User | null;
  sessionId: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (payload: {
    username: string;
    display_name: string;
    password: string;
    class_code: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount — restore session from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('sessionId');
    if (stored) {
      setSessionId(stored);
      api.auth.me()
        .then(({ user }) => setUser(user))
        .catch(() => {
          localStorage.removeItem('sessionId');
          setSessionId(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    const { sessionId, user } = await api.auth.login(username, password);
    localStorage.setItem('sessionId', sessionId);
    setSessionId(sessionId);
    setUser(user);
  };

  const register = async (payload: {
    username: string;
    display_name: string;
    password: string;
    class_code: string;
  }) => {
    const { sessionId, user } = await api.auth.register(payload);
    localStorage.setItem('sessionId', sessionId);
    setSessionId(sessionId);
    setUser(user);
  };

  const logout = async () => {
    await api.auth.logout().catch(() => {});
    localStorage.removeItem('sessionId');
    setSessionId(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, sessionId, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

