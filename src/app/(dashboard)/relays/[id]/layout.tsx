'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { RelayProvider } from './relay-context';
import { RelayShell } from './relay-shell';
import { getRelay, stopRelay as stopRelayApi, restartRelay as restartRelayApi } from '@/lib/api/relays';
import { entityStore } from '@/lib/cache/store';
import { useWs, useWsEvent } from '@/lib/ws/context';
import type { ApiRelay, ApiRelaySpecs } from '@/types/api';
import { useApi } from '@/lib/api/context';
import { NotFound } from '../../not-found';
import { useTranslation } from 'react-i18next';

export default function RelayDetailLayout({ children }: { children: React.ReactNode }) {
    const { isAdmin, isLoading } = useApi();
    const { t } = useTranslation();

    if (isLoading) return null;
    if (!isAdmin) return <NotFound />;

    return <RelayDetailInner>{children}</RelayDetailInner>;
}

function RelayDetailInner({ children }: { children: React.ReactNode }) {
    const params = useParams() as { id: string };
    const relayId = parseInt(params.id, 10);
    const router = useRouter();

    const [relay, setRelay] = useState<ApiRelay | null>(null);
    const [specs, setSpecs] = useState<ApiRelaySpecs | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | undefined>();
    const [actionLoading, setActionLoading] = useState(false);
    const [clientCount, setClientCount] = useState(0);
    const [playerCount, setPlayerCount] = useState(0);

    const { subscribe, unsubscribe, connected } = useWs();

    const fetchRelay = useCallback(async () => {
        setLoading(true);
        setError(undefined);
        try {
            const data = await getRelay(relayId);
            // mirror into global cache for other listeners
            entityStore.put(`relay:${relayId}`, data);
            setRelay(data);
            if (data.status?.specs) setSpecs(data.status.specs);
            if (data.status) setClientCount(data.status.clients);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load relay');
        } finally {
            setLoading(false);
        }
    }, [relayId]);

    useEffect(() => { void fetchRelay(); }, [fetchRelay]);

    useWsEvent('relay_removed', (payload: unknown) => {
        const data = payload as { relay_id: number };
        if (data.relay_id === relayId) router.push('/relays');
    });

    // subscribe to relay-related WS events while mounted / connected
    useEffect(() => {
        const events = [
            'relay_status_change',
            'relay_removed',
            'relay_specs_update',
            'relay_client_connected',
            'relay_client_authentified',
            'relay_client_disconnected',
            'relay_player_join',
            'relay_player_leave',
        ];
        if (connected) subscribe(events);
        // ensure unsubscribe on unmount
        return () => { unsubscribe(events); };
    }, [connected, subscribe, unsubscribe]);

    // keep in sync with entityStore if other parts update the cache
    useEffect(() => {
        if (!relay) return;
        const key = `relay:${relay.id}`;
        return entityStore.subscribe(key, () => {
            const cached = entityStore.get<ApiRelay>(key);
            if (cached) setRelay(cached);
        });
    }, [relay?.id]);

    const stop = async () => {
        setActionLoading(true);
        try { await stopRelayApi(relayId); await fetchRelay(); } catch { /* ignore */ } finally { setActionLoading(false); }
    };

    const restart = async () => {
        setActionLoading(true);
        try { await restartRelayApi(relayId); await fetchRelay(); } catch { /* ignore */ } finally { setActionLoading(false); }
    };

    const value = {
        relayId,
        relay,
        specs,
        loading,
        error,
        actionLoading,
        clientCount,
        playerCount,
        refresh: fetchRelay,
        stop,
        restart,
        setRelay,
        setSpecs,
        setClientCount,
        setPlayerCount,
    } as any;

    return (
        <RelayProvider value={value}>
            <RelayShell>{children}</RelayShell>
        </RelayProvider>
    );
}
