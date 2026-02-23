import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { setAuthExpiredCallback } from '../lib/api';
import { setTokens, clearTokens, getAccessToken, getRefreshToken } from '../lib/storage';
import { hapticSuccess, hapticError } from '../lib/haptics';
// Sentry removed - using no-op stub
const Sentry = {
  init: () => {},
  captureException: (e: any) => console.error(e),
  captureMessage: (m: string) => console.warn(m),
  setUser: (_u: any) => {},
  addBreadcrumb: (_b: any) => {},
  withScope: (cb: any) => cb({ setExtra: () => {}, setTag: () => {} }),
  Native: { wrap: (c: any) => c },
  wrap: (c: any) => c,
  ReactNavigationInstrumentation: class {},
  ReactNativeTracing: class {},
};
import type { User, AuthResponse } from '../types/auth';

const GUEST_USAGE_KEY = 'ecomonitor_guest_usage';
const GUEST_MODE_KEY = 'ecomonitor_guest_mode';
const MAX_GUEST_USES = 3;

interface AuthContextType {
  isAuthenticated: boolean; isLoading: boolean; isGuest: boolean; guestUsageCount: number; user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  loginWithApple: (identityToken: string, authCode: string, fullName?: string, email?: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: (password?: string) => Promise<void>;
  continueAsGuest: () => Promise<void>;
  canUseFeature: () => boolean;
  incrementGuestUsage: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [guestUsageCount, setGuestUsageCount] = useState(0);
  const isAuthenticated = user !== null;

  useEffect(() => {
    const restore = async () => {
      try {
        const token = await getAccessToken();
        if (token) {
          const { data } = await api.get('/auth/me');
          setUser(data.user || data);
        } else {
          const guestMode = await AsyncStorage.getItem(GUEST_MODE_KEY);
          if (guestMode === 'true') {
            setIsGuest(true);
            const usage = await AsyncStorage.getItem(GUEST_USAGE_KEY);
            setGuestUsageCount(usage ? parseInt(usage, 10) : 0);
          }
        }
      } catch { await clearTokens(); }
      finally { setIsLoading(false); }
    };
    restore();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
      await setTokens(data.access_token, data.refresh_token);
      setUser(data.user); Sentry.setUser({ id: data.user.id, email: data.user.email }); setIsGuest(false); await AsyncStorage.removeItem(GUEST_MODE_KEY); hapticSuccess();
    } catch (err) { hapticError(); throw err; }
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    try {
      const { data } = await api.post<AuthResponse>('/auth/register', { email, password });
      await setTokens(data.access_token, data.refresh_token);
      setUser(data.user); Sentry.setUser({ id: data.user.id, email: data.user.email }); setIsGuest(false); await AsyncStorage.removeItem(GUEST_MODE_KEY); hapticSuccess();
    } catch (err) { hapticError(); throw err; }
  }, []);

  const loginWithApple = useCallback(async (identityToken: string, authCode: string, fullName?: string, email?: string) => {
    try {
      const { data } = await api.post<AuthResponse>('/auth/apple', { identity_token: identityToken, authorization_code: authCode, full_name: fullName, email });
      await setTokens(data.access_token, data.refresh_token);
      setUser(data.user); Sentry.setUser({ id: data.user.id, email: data.user.email }); setIsGuest(false); await AsyncStorage.removeItem(GUEST_MODE_KEY); hapticSuccess();
    } catch (err) { hapticError(); throw err; }
  }, []);

  const logout = useCallback(async () => {
    try { const rt = await getRefreshToken(); if (rt) await api.post('/auth/logout', { refresh_token: rt }); } catch {}
    finally { await clearTokens(); setUser(null); Sentry.setUser(null); setIsGuest(false); await AsyncStorage.removeItem(GUEST_MODE_KEY); }
  }, []);

  useEffect(() => {
    setAuthExpiredCallback(logout);
    return () => setAuthExpiredCallback(null);
  }, [logout]);

  const deleteAccount = useCallback(async (password?: string) => {
    await api.delete('/auth/account', { data: { password: password || '' } });
    await clearTokens(); setUser(null); hapticSuccess();
  }, []);

  const continueAsGuest = useCallback(async () => {
    setIsGuest(true); await AsyncStorage.setItem(GUEST_MODE_KEY, 'true'); hapticSuccess();
  }, []);

  const canUseFeature = useCallback(() => isAuthenticated ? true : guestUsageCount < MAX_GUEST_USES, [isAuthenticated, guestUsageCount]);

  const incrementGuestUsage = useCallback(async () => {
    const n = guestUsageCount + 1; setGuestUsageCount(n); await AsyncStorage.setItem(GUEST_USAGE_KEY, n.toString());
  }, [guestUsageCount]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, isGuest, guestUsageCount, user, login, register, loginWithApple, logout, deleteAccount, continueAsGuest, canUseFeature, incrementGuestUsage }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}