'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import type { NoxWellKnown } from '@/types/wellknown';
import type { ApiCurrentUser } from '@/types/api';
import { fetchWellKnown } from './wellknown';
import { apiFetch, registerLogoutDispatch, registerGatewayUrl, registerCurrentUserReplace, registerCurrentUserMerge } from './client';
import { getToken, setToken, clearToken } from '@/lib/auth/storage';
import { fetchConfigs, type InstanceConfig } from './configs';

// ── Context shape ───────────────────────────────────────────────────────────

interface ApiContextValue {
  wellKnown: NoxWellKnown | null;
  config: InstanceConfig | null;
  currentUser: ApiCurrentUser | null;
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (token: string, expires: number, user: ApiCurrentUser) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const ApiContext = createContext<ApiContextValue | null>(null);

// ── Provider ────────────────────────────────────────────────────────────────

export function ApiProvider({ children }: { children: React.ReactNode }) {
  const [wellKnown, setWellKnown] = useState<NoxWellKnown | null>(null);
  const [instanceConfig, setInstanceConfig] = useState<InstanceConfig | null>(null);
  const [currentUser, setCurrentUser] = useState<ApiCurrentUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    // Invalidate the session on the backend before clearing local state
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {
      // ignore errors — still clear local state
    }
    clearToken();
    setTokenState(null);
    setCurrentUser(null);
  }, []);

  const login = useCallback(
    (newToken: string, _expires: number, user: ApiCurrentUser) => {
      setToken(newToken);
      setTokenState(newToken);
      setCurrentUser(user);
    },
    [],
  );

  const refreshUser = useCallback(async () => {
    const wk = await fetchWellKnown();
    if (!wk) return;
    const tok = getToken();
    if (!tok) return;
    registerGatewayUrl(wk.gateway.api);
    try {
      const user = await apiFetch<ApiCurrentUser>('/users/@me');
      setCurrentUser(user);
    } catch {
      clearToken();
      setTokenState(null);
      setCurrentUser(null);
    }
  }, []);

  // Register the logout dispatcher so apiFetch can call it on 401
  useEffect(() => {
    registerLogoutDispatch(() => {
      clearToken();
      setTokenState(null);
      setCurrentUser(null);
    });
    // Replace currentUser wholesale (from WS hello)
    registerCurrentUserReplace(setCurrentUser);
    // Merge ApiUser fields into currentUser (from WS user:update)
    registerCurrentUserMerge((u) =>
      setCurrentUser((prev) => (prev?.id === u.id ? { ...prev, ...u } : prev)),
    );
  }, []);

  // Boot sequence: wellknown → token → /api/users/@me
  useEffect(() => {
    let cancelled = false;

    async function boot() {
      // 1. Fetch well-known
      const wk = await fetchWellKnown();
      if (cancelled) return;
      setWellKnown(wk);

      // 2. Register gateway URL immediately so apiFetch can be used
      if (wk) registerGatewayUrl(wk.gateway.api);

      // 3. Fetch public instance config (registration flag, etc.)
      if (wk) {
        const cfg = await fetchConfigs();
        if (!cancelled) setInstanceConfig(cfg);
      }

      // 3. Read stored token
      const storedToken = getToken();
      if (!storedToken || !wk) {
        setIsLoading(false);
        return;
      }
      setTokenState(storedToken);

      // 4. Validate token by fetching current user
      try {
        const user = await apiFetch<ApiCurrentUser>('/users/@me');
        if (!cancelled) setCurrentUser(user);
      } catch {
        // 401 or network error — clearToken already called by apiFetch on 401
        if (!cancelled) {
          clearToken();
          setTokenState(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    boot();
    return () => {
      cancelled = true;
    };
  }, []);

  const isAdmin = currentUser?.tags.includes('sys:admin') ?? false;

  return (
    <ApiContext.Provider
      value={{
        wellKnown,
        config: instanceConfig,
        currentUser,
        token,
        isLoading,
        isAdmin,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </ApiContext.Provider>
  );
}

// ── Hooks ───────────────────────────────────────────────────────────────────

export function useApi(): ApiContextValue {
  const ctx = useContext(ApiContext);
  if (!ctx) throw new Error('useApi must be used within <ApiProvider>');
  return ctx;
}

export function useCurrentUser(): ApiCurrentUser | null {
  return useApi().currentUser;
}
