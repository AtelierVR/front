'use client';

import { useRelayContext } from './relay-context';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { Icon } from '@iconify/react';
import { getProtocol } from '@/lib/protocols';
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
    const { relay, loading } = useRelayContext();
    const { t } = useTranslation();

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
    const ports = relay.runner?.ports ?? [];

    return (
        <div className="flex flex-col gap-4">
            <div className="rounded-lg border border-border bg-accent/10 p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t('admin.general')}</p>
                <div className="divide-y divide-border">
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

            {ports.length > 0 && (
                <div className="rounded-lg border border-border bg-accent/10 p-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        {t('admin.ports')}
                        <span className="ml-2 normal-case font-normal text-muted-foreground/70">({ports.length})</span>
                    </p>
                    <div className="divide-y divide-border">
                        {ports.map((p, i) => {
                            const proto = getProtocol(p.protocol);
                            return (
                                <div key={i} className="flex items-center justify-between py-1.5">
                                    <span className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground uppercase">
                                        <Icon icon={proto.icon} className="size-3.5 shrink-0" />
                                        {p.protocol}
                                    </span>
                                    <span className="text-sm font-mono">{p.host}:{p.port}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {Object.keys(meta).length > 0 && (
                <div className="rounded-lg border border-border bg-accent/10 p-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t('admin.runner_meta')}</p>
                    <div className="divide-y divide-border">
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
