'use client';

import { createContext, useContext } from 'react';
import { useWsEvent } from '@/lib/ws/context';
import type { ApiRelay, ApiRelaySpecs } from '@/types/api';

interface RelayContextValue {
    relayId: number;
    relay: ApiRelay | null;
    specs: ApiRelaySpecs | null;
    loading: boolean;
    error: string | undefined;
    actionLoading: boolean;
    clientCount: number;
    playerCount: number;
    refresh: () => void;
    stop: () => Promise<void>;
    restart: () => Promise<void>;
}

const RelayContext = createContext<RelayContextValue | null>(null);

export function useRelayContext(): RelayContextValue {
    const ctx = useContext(RelayContext);
    if (!ctx) throw new Error('useRelayContext must be used inside RelayProvider');
    return ctx;
}

type Setter<T> = (v: T | ((prev: T) => T)) => void;

interface RelayProviderProps {
    value: RelayContextValue & {
        setRelay: Setter<ApiRelay | null>;
        setSpecs: Setter<ApiRelaySpecs | null>;
        setClientCount: Setter<number>;
        setPlayerCount: Setter<number>;
    };
    children: React.ReactNode;
}

export function RelayProvider({ value, children }: RelayProviderProps) {
    // ── Relay status (connected / disconnected / ready) ──────────────────────
    useWsEvent('relay_status_change', (payload: unknown) => {
        const data = payload as { relay_id: number; status?: string; relay?: ApiRelay | null };
        if (data.relay_id !== value.relayId) return;
        if (data.relay) {
            value.setRelay(data.relay);
            if (data.relay.status?.specs) value.setSpecs(data.relay.status.specs);
            if (data.relay.status) value.setClientCount(data.relay.status.clients);
        } else if (data.status === 'disconnected') {
            value.setRelay(prev => prev ? { ...prev, connected: false } : prev);
        }
    });

    // ── Live specs updates ───────────────────────────────────────────────────
    useWsEvent('relay_specs_update', (payload: unknown) => {
        const data = payload as { relay_id: number; details: ApiRelaySpecs };
        if (data.relay_id !== value.relayId) return;
        value.setSpecs(data.details);
        value.setRelay(prev => {
            if (!prev?.status) return prev;
            return { ...prev, status: { ...prev.status, specs: data.details } };
        });
    });

    // ── Client connect / disconnect ──────────────────────────────────────────
    useWsEvent('relay_client_connected', (payload: unknown) => {
        const data = payload as { relay_id: number };
        if (data.relay_id !== value.relayId) return;
        value.setClientCount(c => c + 1);
        value.setRelay(prev => {
            if (!prev?.status) return prev;
            return { ...prev, status: { ...prev.status, clients: prev.status.clients + 1 } };
        });
    });

    useWsEvent('relay_client_disconnected', (payload: unknown) => {
        const data = payload as { relay_id: number };
        if (data.relay_id !== value.relayId) return;
        value.setClientCount(c => Math.max(0, c - 1));
        value.setRelay(prev => {
            if (!prev?.status) return prev;
            return { ...prev, status: { ...prev.status, clients: Math.max(0, prev.status.clients - 1) } };
        });
    });

    // ── Player join / leave ──────────────────────────────────────────────────
    useWsEvent('relay_player_join', (payload: unknown) => {
        const data = payload as { relay_id: number };
        if (data.relay_id !== value.relayId) return;
        value.setPlayerCount(c => c + 1);
    });

    useWsEvent('relay_player_leave', (payload: unknown) => {
        const data = payload as { relay_id: number };
        if (data.relay_id !== value.relayId) return;
        value.setPlayerCount(c => Math.max(0, c - 1));
    });

    // Provide a sanitized value to consumers (no setters)
    const provided: RelayContextValue = {
        relayId: value.relayId,
        relay: value.relay,
        specs: value.specs,
        loading: value.loading,
        error: value.error,
        actionLoading: value.actionLoading,
        clientCount: value.clientCount,
        playerCount: value.playerCount,
        refresh: value.refresh,
        stop: value.stop,
        restart: value.restart,
    };

    return (
        <RelayContext.Provider value={provided}>
            {children}
        </RelayContext.Provider>
    );
}
