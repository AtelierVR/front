'use client';

import { useEffect, useState } from 'react';
import { useApi } from '@/lib/api/context';
import { listRelays } from '@/lib/api';
import { SiteHeader } from '@/components/site-header';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { ApiRelay } from '@/types/api';
import type { NoxWellKnown } from '@/types/wellknown';
import { useTranslation } from 'react-i18next';
import { NotFound } from '@/app/(dashboard)/not-found';

function resolveLabel(relay: ApiRelay): string {
    if (!relay.label) return `Relay #${relay.id}`;
    if (typeof relay.label === 'string') return relay.label;
    const obj = relay.label as Record<string, string>;
    return obj['en'] ?? Object.values(obj)[0] ?? `Relay #${relay.id}`;
}

function relayDot(relay: ApiRelay): string {
    if (!relay.connected) return 'bg-zinc-400';
    const s = relay.runner?.status;
    if (s === 'running') return 'bg-green-500';
    if (s === 'pending' || s === 'starting') return 'bg-yellow-400';
    return 'bg-zinc-400';
}

function StatCard({ label, value, icon, color }: { label: string; value: string | number | null; icon: string; color?: string }) {
    return (
        <div className="p-5 flex items-center gap-4 rounded-lg border border-border bg-accent/10">
            <div className={cn('rounded-lg p-2.5 shrink-0', color ?? 'bg-primary/10')}>
                <Icon icon={icon} className={cn('size-5', color ? 'text-white' : 'text-primary')} />
            </div>
            <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                {value !== null
                    ? <p className="text-2xl font-semibold tabular-nums">{value}</p>
                    : <Skeleton className="h-7 w-16 mt-0.5" />}
            </div>
        </div>
    );
}

function formatUptime(seconds: number): string {
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
    return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`;
}

export default function AdminDashboardPage() {
    const { wellKnown, isAdmin, isLoading } = useApi();
    const { t } = useTranslation();
    const [relays, setRelays] = useState<ApiRelay[] | null>(null);

    useEffect(() => {
        if (!isAdmin) return;
        listRelays().then(setRelays).catch(() => setRelays([]));
    }, [isAdmin]);

    if (isLoading) return null;
    if (!isAdmin) return <NotFound />;

    const connectedRelays = relays?.filter(r => r.connected) ?? null;
    const totalInstances = connectedRelays?.reduce((s, r) => s + (r.status?.instances.count ?? 0), 0) ?? null;
    const totalClients = connectedRelays?.reduce((s, r) => s + (r.status?.clients ?? 0), 0) ?? null;

    return (
        <>
            <SiteHeader children={t('admin.title')} />
            <div className="flex flex-1 flex-col p-4 md:p-6 gap-6">

                {/* Server identity */}
                <ServerIdentity wellKnown={wellKnown} />

                {/* Stats grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        label={t('admin.relays')}
                        value={relays ? relays.length : null}
                        icon="material-symbols:cell-tower-rounded"
                    />
                    <StatCard
                        label={t('admin.connected')}
                        value={connectedRelays ? connectedRelays.length : null}
                        icon="material-symbols:wifi-rounded"
                        color="bg-green-500"
                    />
                    <StatCard
                        label={t('admin.active_instances')}
                        value={totalInstances}
                        icon="material-symbols:dns"
                    />
                    <StatCard
                        label={t('admin.clients_online')}
                        value={totalClients}
                        icon="material-symbols:groups-rounded"
                    />
                </div>

                {/* Relay list */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold">{t('admin.relays')}</h2>
                        <Link href="/relays" className="text-xs text-primary hover:underline">
                            {t('admin.view_all')} →
                        </Link>
                    </div>
                    {relays === null ? (
                        <div className="flex flex-col gap-2">
                            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
                        </div>
                    ) : relays.length === 0 ? (
                        <div className="p-6 flex flex-col items-center gap-2 text-muted-foreground rounded-lg border border-dashed border-border">
                            <Icon icon="material-symbols:dns" className="size-8 opacity-30" />
                            <p className="text-sm">{t('admin.no_relays')}</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {relays.map(relay => (
                                <Link key={relay.id} href={`/relays/${relay.id}`}>
                                    <div className="px-4 py-3 flex items-center gap-3 hover:bg-accent/50 transition-colors cursor-pointer rounded-lg border border-border bg-accent/10">
                                        <span className={cn('size-2.5 rounded-full shrink-0', relayDot(relay), relay.connected && relay.runner?.status === 'running' && 'animate-pulse')} />
                                        <span className="flex-1 text-sm font-medium truncate">{resolveLabel(relay)}</span>
                                        <span className="text-xs text-muted-foreground shrink-0">{relay.provider}</span>
                                        {relay.status && (
                                            <span className="text-xs text-muted-foreground shrink-0">
                                                {relay.status.instances.count}/{relay.status.instances.limit}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Server info */}
                {wellKnown && (
                    <div className="p-4 flex flex-wrap gap-x-8 gap-y-3 rounded-lg border border-border bg-accent/10">
                        <div className="flex flex-col gap-0.5">
                            <p className="text-xs text-muted-foreground">{t('admin.version')}</p>
                            <p className="text-sm font-mono">{wellKnown.software.version}</p>
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <p className="text-xs text-muted-foreground">{t('admin.server_status')}</p>
                            <p className="text-sm capitalize">{wellKnown.status}</p>
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <p className="text-xs text-muted-foreground">{t('admin.uptime')}</p>
                            <p className="text-sm font-mono">
                                {formatUptime(Math.floor((Date.now() / 1000) - wellKnown.started))}
                            </p>
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <p className="text-xs text-muted-foreground">{t('admin.address')}</p>
                            <p className="text-sm font-mono">{wellKnown.address}:{wellKnown.port}</p>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

function ServerIdentity({ wellKnown }: { wellKnown: NoxWellKnown | null }) {
    if (!wellKnown) return null;
    const title = wellKnown.metadata.title;
    const name = typeof title === 'string' ? title : (title as Record<string, string>)['en'] ?? Object.values(title as Record<string, string>)[0] ?? 'Nox';
    const desc = wellKnown.metadata.description;
    const description = !desc ? null : typeof desc === 'string' ? desc : (desc as Record<string, string>)['en'] ?? null;

    return (
        <div className="flex items-center gap-3">
            <div className="size-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
                <Icon icon="material-symbols:shield-rounded" className="size-6 text-primary-foreground" />
            </div>
            <div>
                <h1 className="text-lg font-semibold">{name}</h1>
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
            <Badge
                variant="secondary"
                className={cn('ml-auto capitalize', wellKnown.status === 'online' ? 'text-green-600' : 'text-yellow-600')}
            >
                {wellKnown.status}
            </Badge>
        </div>
    );
}
