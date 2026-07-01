'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { getInstance } from '@/lib/api/instances';
import { getRelayInstance, getRelayLiveInstances } from '@/lib/api/relays';
import type { ApiInstance } from '@/types/api';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWsEvent } from '@/lib/ws/context';
import { RelayInstanceContext, type RelayInstanceTpsInfo } from './instance-context';

const TABS = [
    { label: 'Details', value: '' },
    { label: 'Players', value: 'players' },
];

export default function RelayInstanceLayout({ children }: { children: React.ReactNode }) {
    const params = useParams<{ id: string; iid: string }>();
    const router = useRouter();
    const pathname = usePathname();
    const { t } = useTranslation();

    const [instance, setInstance] = useState<ApiInstance | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | undefined>();
    const [tpsInfo, setTpsInfo] = useState<RelayInstanceTpsInfo | null>(null);

    const doFetch = useCallback(async () => {
        setLoading(true);
        setError(undefined);
        try {
            const data = await getRelayInstance(Number(params.id), params.iid);
            setInstance(data);
        } catch {
            // Fallback: relay might be offline, try direct DB lookup
            try {
                const data = await getInstance(params.iid);
                setInstance(data);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Failed to load instance');
            }
        }

        // Fetch TPS/threshold from live instances
        try {
            const liveResult = await getRelayLiveInstances(Number(params.id), 1000, 0);
            const liveInst = liveResult.items.find(
                i => String(i.id) === params.iid,
            );
            if (liveInst) {
                setTpsInfo({
                    tps: liveInst.tps ?? null,
                    threshold: liveInst.threshold ?? null,
                    effective_tps: liveInst.effective_tps ?? null,
                    effective_threshold: liveInst.effective_threshold ?? null,
                });
            }
        } catch {
            // Relay offline, TPS info not available
            setTpsInfo(null);
        } finally {
            setLoading(false);
        }
    }, [params.id, params.iid]);

    const fetchInstance = doFetch;

    useEffect(() => { void fetchInstance(); }, [fetchInstance]);

    // Live update TPS/threshold when relay emits instance_settings_changed
    useWsEvent('relay_instance_settings_changed', (payload: unknown) => {
        console.log(payload);
        const data = payload as { relay_id: number; internal_id: number; tps: number; threshold: number };
        if (data.relay_id !== Number(params.id) || String(data.internal_id) !== params.iid) return;
        setTpsInfo(prev => ({
            ...prev,
            tps: data.tps ?? prev?.tps ?? null,
            threshold: data.threshold ?? prev?.threshold ?? null,
            effective_tps: null, // will be recalculated by relay, refetch later
            effective_threshold: null,
        }));
    });

    const basePath = `/relays/${params.id}/instances/${params.iid}`;
    const activeTab = pathname === basePath ? '' : pathname.slice(basePath.length + 1).split('/')[0];

    const title = instance?.title || instance?.name || `Instance #${params.iid}`;

    return (
        <RelayInstanceContext.Provider value={{ iid: params.iid, instance, loading, error, refresh: fetchInstance, tpsInfo }}>
            <div className="flex flex-1 flex-col gap-4">
                {/* Instance title bar */}
                <div className="flex items-center gap-3 min-w-0">
                    <Button variant="ghost" size="icon-sm" onClick={() => router.push(`/relays/${params.id}/instances`)} aria-label="Back">
                        <Icon icon="material-symbols:arrow-back-rounded" className="size-4" />
                    </Button>
                    <div className="flex flex-col min-w-0">
                        {loading
                            ? <Skeleton className="h-4 w-40" />
                            : <span className="text-sm font-medium truncate">{title}</span>}
                        {instance && (
                            <span className="text-xs text-muted-foreground font-mono truncate">{instance.server}</span>
                        )}
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <Tabs value={activeTab} onValueChange={v => router.push(v === '' ? basePath : `${basePath}/${v}`)}>
                            <TabsList>
                                {TABS.map(tab => (
                                    <TabsTrigger key={tab.value} value={tab.value}>
                                        {tab.value === 'players' ? t('admin.instance_players') : 'Details'}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>
                        <Button variant="ghost" size="icon-sm" onClick={fetchInstance} disabled={loading} aria-label="Refresh">
                            <Icon icon="material-symbols:refresh-rounded" className={loading ? 'animate-spin' : ''} />
                        </Button>
                    </div>
                </div>

                {/* Tab content */}
                <div className="flex flex-1 flex-col min-h-0">
                    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                        {children}
                    </Suspense>
                </div>
            </div>
        </RelayInstanceContext.Provider>
    );
}
