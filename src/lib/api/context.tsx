'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import type { NoxWellKnown } from '@/types/wellknown';
import type { ApiCurrentUser } from '@/types/api';
import { fetchWellKnown } from './wellknown';
import { apiFetch, registerLogoutDispatch, registerGatewayUrl, registerCurrentUserReplace, registerCurrentUserMerge, registerVerificationHandler, type VerificationMethod } from './client';
import { getToken, setToken, clearToken } from '@/lib/auth/storage';
import { fetchConfigs, type InstanceConfig } from './configs';
import { VerificationModal } from '@/components/shared/VerificationModal';

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

  // ── Global verification modal ──────────────────────────────────────────
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationMethods, setVerificationMethods] = useState<VerificationMethod[]>([]);
  const verificationResolveRef = useRef<((code: string | null) => void) | null>(null);
  const verifyCodeRef = useRef<((code: string) => Promise<{ success: boolean; error?: string }>) | null>(null);

  const handleVerificationRequired = useCallback(
    async (
      methods: VerificationMethod[],
      verifyCode: (code: string) => Promise<{ success: boolean; error?: string }>,
    ): Promise<string | null> => {
      setVerificationMethods(methods);
      verifyCodeRef.current = verifyCode;
      setShowVerificationModal(true);
      return new Promise((resolve) => {
        verificationResolveRef.current = resolve;
      });
    },
    [],
  );

  const handleVerificationSubmit = useCallback(async (code: string): Promise<{ success: boolean; error?: string }> => {
    const verify = verifyCodeRef.current;
    if (!verify) return { success: false, error: 'Verification unavailable' };
    const result = await verify(code);
    if (result.success) {
      // Let the modal show "Verified" then close itself via the onVerified callback
      return { success: true };
    }
    return result;
  }, []);

  const handleVerificationDone = useCallback(() => {
    // Called by the modal after the "Verified" animation
    setShowVerificationModal(false);
    verificationResolveRef.current?.('done');
    verificationResolveRef.current = null;
    verifyCodeRef.current = null;
  }, []);

  const handleVerificationClose = useCallback(() => {
    setShowVerificationModal(false);
    verificationResolveRef.current?.(null);
    verificationResolveRef.current = null;
    verifyCodeRef.current = null;
  }, []);

  // Register the global verification handler
  useEffect(() => {
    registerVerificationHandler(handleVerificationRequired);
  }, [handleVerificationRequired]);

  const logout = useCallback(async () => {
    // Call the server logout endpoint to invalidate the session
    try {
      await apiFetch<{ success: boolean }>('/auth/logout', { method: 'POST' });
    } catch { /* best-effort */ }
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

  // Periodically retry wellKnown when it's null (API was unreachable at boot)
  useEffect(() => {
    if (wellKnown !== null || isLoading) return;
    const interval = setInterval(async () => {
      const wk = await fetchWellKnown();
      if (wk) {
        setWellKnown(wk);
        registerGatewayUrl(wk.gateway.api);
        // Also fetch configs once we have a working API
        const cfg = await fetchConfigs();
        setInstanceConfig(cfg);
        // If we have a stored token, try to restore the session
        const storedToken = getToken();
        if (storedToken) {
          setTokenState(storedToken);
          try {
            const user = await apiFetch<ApiCurrentUser>('/users/@me');
            setCurrentUser(user);
          } catch {
            clearToken();
            setTokenState(null);
          }
        }
        setIsLoading(false);
      }
    }, 10_000);
    return () => clearInterval(interval);
  }, [wellKnown, isLoading]);

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
      <VerificationModal
        isOpen={showVerificationModal}
        onClose={handleVerificationClose}
        onSubmit={handleVerificationSubmit}
        onVerified={handleVerificationDone}
        methods={verificationMethods}
      />
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
