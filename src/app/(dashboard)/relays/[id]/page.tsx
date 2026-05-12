'use client';

import { useEffect, useState } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { Icon } from '@iconify/react';
import { getRelayInstances } from '@/lib/api';
import { useRelayContext } from './relay-context';
import { useTranslation } from 'react-i18next';
import type { ApiRelayAssignedInstance } from '@/types/api';
import { formatDistanceToNow } from 'date-fns';

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-4 py-1.5">
            <span className="text-sm text-muted-foreground shrink-0">{label}</span>
            <span className="text-sm text-right font-mono break-all">{value ?? '—'}</span>
        </div>
    );
}

export default function RelayDetailPage() {
    const { relay, loading, relayId } = useRelayContext();
    const { t } = useTranslation();
    const [assigned, setAssigned] = useState<ApiRelayAssignedInstance[] | null>(null);

    useEffect(() => {
        getRelayInstances(relayId)
            .then(r => setAssigned(r.items))
            .catch(() => setAssigned([]));
    }, [relayId]);

    if (loading) {
        return (
            <div className="flex flex-col gap-3">
                <Skeleton className="h-40 rounded-lg" />
                <Skeleton className="h-32 rounded-lg" />
            </div>
        );
    }

    if (!relay) return null;

    const meta = relay.runner?.meta ?? {};

    return (
        <div className="flex flex-col gap-4">
            <div className="rounded-lg border border-border bg-accent/10 p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t('admin.general')}</p>
                <div className="space-y-1.5">
                    <InfoRow label="ID" value={relay.id} />
                    <InfoRow label="Provider" value={relay.provider} />
                    <InfoRow label="Provider ID" value={relay.runner?.provider_id} />
                    <InfoRow label="Runner status" value={relay.runner?.status ?? 'none'} />
                    <InfoRow label="Started at" value={relay.runner?.started_at ? formatDistanceToNow(new Date(relay.runner.started_at)) : null} />
                    <InfoRow label="Connected" value={relay.connected ? t('common.yes') : t('common.no')} />
                    <InfoRow label="Created at" value={formatDistanceToNow(new Date(relay.created_at))} />
                    {relay.status && (
                        <>
                            <InfoRow label="Engine" value={`${relay.status.engine} ${relay.status.version}`} />
                            <InfoRow label="Protocol" value={"0x"+relay.status.protocol.toString(16).padStart(2, '0')} />
                            <InfoRow label="Ping" value={relay.status.ping !== null ? `${relay.status.ping}ms` : null} />
                        </>
                    )}
                </div>
            </div>

            <div className="rounded-lg border border-border bg-accent/10 p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    {t('admin.assigned_instances')}
                    {assigned !== null && (
                        <span className="ml-2 normal-case font-normal text-muted-foreground/70">({assigned.length})</span>
                    )}
                </p>
                {assigned === null ? (
                    <Skeleton className="h-8 rounded" />
                ) : assigned.length === 0 ? (
                    <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                        <Icon icon="material-symbols:deployed-code" className="size-4 opacity-40" />
                        {t('admin.no_relay_instances')}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {assigned.map(i => (
                            <div key={i.id} className="flex items-center justify-between py-2 px-3 rounded bg-muted/50 border border-border">
                                <div className="flex items-center gap-2 min-w-0">
                                    <Icon icon="material-symbols:deployed-code" className="size-4 shrink-0 text-muted-foreground" />
                                    <span className="text-sm font-mono truncate">{i.name}</span>
                                    {i.title && <span className="text-xs text-muted-foreground truncate ml-1">· {i.title}</span>}
                                </div>
                                <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                                    <span>cap: {i.capacity === 0 ? '∞' : i.capacity}</span>
                                    <span className="font-mono">{i.world}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {Object.keys(meta).length > 0 && (
                <div className="rounded-lg border border-border bg-accent/10 p-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t('admin.runner_meta')}</p>
                    <div className="space-y-1.5">
                        {Object.entries(meta).map(([k, v]) => (
                            <InfoRow key={k} label={k} value={v} />
                        ))}
                    </div>
                </div>
            )}

            {relay.tags.length > 0 && (
                <div className="rounded-lg border border-border bg-accent/10 p-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t('world.tags')}</p>
                    <div className="flex flex-wrap gap-1.5">
                        {relay.tags.map(tag => (
                            <span key={tag} className="text-xs bg-muted/80 px-2.5 py-1 rounded border border-border font-mono">{tag}</span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
