'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { SidebarCard } from '@/components/shared/SidebarCard';
import { getInstance } from '@/lib/api/instances';
import { getAlias, useApi } from '@/lib/api';
import type { ApiInstance } from '@/types/api';
import { noxIdToSegment } from '@/types/nox-identifier';
import { useUser } from './UserContext';

interface InstanceRow {
    iid: string;
    instance: ApiInstance | null;
    loading: boolean;
}

export function UserLocations() {
    const { user } = useUser();
    const { t } = useTranslation();
    const { wellKnown } = useApi();
    const localAddress = wellKnown?.address ?? '::';
    const [rows, setRows] = useState<InstanceRow[]>([]);

    const locations = user?.presence?.locations ?? null;

    useEffect(() => {
        if (!locations || locations.length === 0) {
            setRows([]);
            return;
        }

        // Initialise rows with loading state
        setRows(locations.map(iid => ({ iid, instance: null, loading: true })));

        for (const iid of locations) {
            const [rawId] = iid.split('@');
            getInstance(rawId).then(instance => {
                setRows(prev =>
                    prev.map(r => r.iid === iid ? { iid, instance, loading: false } : r)
                );
            }).catch(() => {
                setRows(prev =>
                    prev.map(r => r.iid === iid ? { iid, instance: null, loading: false } : r)
                );
            });
        }
    }, [JSON.stringify(locations)]);

    // null = no permission — render nothing
    if (locations === null) return null;
    // empty list — render nothing
    if (locations.length === 0) return null;

    return (
        <SidebarCard title={t('user.locations')}>
            <ul className="space-y-2">
                {rows.map(({ iid, instance, loading }) => {
                    const rawId = instance
                        ? (getAlias(instance.alias, 'nid') ?? getAlias(instance.alias, 'iid') ?? iid)
                        : iid;
                    const href = `/i/${noxIdToSegment(rawId, localAddress)}`;
                    return (
                        <li key={iid}>
                            <Link
                                href={href}
                                className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted transition-colors group"
                            >
                                {/* Thumbnail */}
                                <div className="size-9 shrink-0 rounded-sm overflow-hidden bg-muted flex items-center justify-center">
                                    {loading ? (
                                        <div className="animate-pulse w-full h-full bg-muted-foreground/20 rounded-sm" />
                                    ) : instance?.thumbnail ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={instance.thumbnail}
                                            alt={instance.title ?? instance.name ?? ''}
                                            className="size-full object-cover"
                                        />
                                    ) : (
                                        <Icon icon="material-symbols:gamepad-rounded" className="size-5 text-muted-foreground" />
                                    )}
                                </div>

                                {/* Labels */}
                                <div className="min-w-0 flex-1">
                                    {loading ? (
                                        <div className="animate-pulse h-3 rounded-sm bg-muted w-24" />
                                    ) : (
                                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                                            {instance?.title ?? instance?.name ?? iid}
                                        </p>
                                    )}
                                    {!loading && instance && (
                                        <p className="text-xs text-muted-foreground tabular-nums">
                                            {instance.capacity > 0
                                                ? t('instance.players', { count: instance.count, capacity: instance.capacity })
                                                : t('instance.players_count', { count: instance.count })}
                                        </p>
                                    )}
                                </div>

                                <Icon icon="material-symbols:arrow-forward-ios-rounded" className="size-3.5 text-muted-foreground shrink-0" />
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </SidebarCard>
    );
}
