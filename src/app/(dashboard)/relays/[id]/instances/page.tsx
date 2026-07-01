'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { getRelayInstances } from '@/lib/api';
import { batchGetUsers } from '@/lib/api/users';
import { getWorld } from '@/lib/api/worlds';
import { getWellKnownAddress } from '@/lib/api/wellknown';
import { parseNoxId, worldInfoToString } from '@/types/nox-identifier';
import type { ApiRelayAssignedInstance, ApiUser, ApiWorld } from '@/types/api';
import { ApiError } from '@/types/envelope';
import { useTranslation } from 'react-i18next';
import { usePagination } from '@/hooks/usePagination';
import { Icon } from '@iconify/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow, format } from 'date-fns';

export default function RelayInstancesPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const relayId = parseInt(params.id, 10);
    const { t } = useTranslation();
    const { page, limit, setPage } = usePagination();

    const [allInstances, setAllInstances] = useState<ApiRelayAssignedInstance[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | undefined>();
    const [relayOffline, setRelayOffline] = useState(false);

    const [userMap, setUserMap] = useState<Map<string, ApiUser>>(new Map());
    const [worldMap, setWorldMap] = useState<Map<string, ApiWorld>>(new Map());
    const fetchedUsersRef = useRef<Set<string>>(new Set());
    const fetchedWorldsRef = useRef<Set<string>>(new Set());

    const fetchInstances = useCallback(async () => {
        setLoading(true);
        setError(undefined);
        setRelayOffline(false);
        try {
            const res = await getRelayInstances(relayId);
            setAllInstances(res.items ?? []);
        } catch (e) {
            if (e instanceof ApiError && e.status === 503) {
                setRelayOffline(true);
            } else {
                setError(e instanceof Error ? e.message : 'Failed to load instances');
            }
        } finally {
            setLoading(false);
        }
    }, [relayId]);

    useEffect(() => { void fetchInstances(); }, [fetchInstances]);

    const pageInstances = useMemo(() => {
        const start = (page - 1) * limit;
        return allInstances.slice(start, start + limit);
    }, [allInstances, page, limit]);

    const pageCount = Math.max(1, Math.ceil(allInstances.length / limit));

    // Batch-fetch owner users for visible instances
    useEffect(() => {
        const toFetch = pageInstances
            .map(i => i.owner)
            .filter((u): u is string => !!u && !fetchedUsersRef.current.has(u));
        if (toFetch.length === 0) return;
        for (const id of toFetch) fetchedUsersRef.current.add(id);
        batchGetUsers(toFetch)
            .then(res => {
                setUserMap(prev => {
                    const next = new Map(prev);
                    for (const user of res.items) {
                        for (const id of toFetch) {
                            const atIdx = id.lastIndexOf('@');
                            if (atIdx < 0) continue;
                            const rawId = id.slice(0, atIdx);
                            const server = id.slice(atIdx + 1);
                            if (user.server === server && String(user.id) === rawId) {
                                next.set(id, user);
                            }
                        }
                    }
                    return next;
                });
            })
            .catch(() => {});
    }, [pageInstances]); // eslint-disable-line react-hooks/exhaustive-deps

    // Fetch world info for visible instances
    useEffect(() => {
        const toFetch = pageInstances
            .map(i => i.world)
            .filter((w): w is string => !!w && !fetchedWorldsRef.current.has(w));
        if (toFetch.length === 0) return;
        for (const w of toFetch) fetchedWorldsRef.current.add(w);

        const localServer = getWellKnownAddress();
        for (const worldId of toFetch) {
            const parsed = parseNoxId(worldId);
            // Strip local server suffix to get a compact ID the API accepts
            const apiId =
                localServer && parsed.server === localServer
                    ? parsed.id
                    : parsed.server
                        ? `${parsed.id}@${parsed.server}`
                        : parsed.id;
            getWorld(apiId)
                .then(world => {
                    setWorldMap(prev => new Map(prev).set(worldId, world));
                })
                .catch(() => {});
        }
    }, [pageInstances]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="flex flex-1 flex-col gap-4">
            {error && (
                <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
                    <p className="text-sm text-destructive">{error}</p>
                </div>
            )}

            {relayOffline && (
                <div className="rounded-lg border border-dashed p-8 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Icon icon="material-symbols:wifi-off-rounded" className="size-8 opacity-40" />
                        <p className="text-sm">{t('admin.relay_unavailable')}</p>
                    </div>
                </div>
            )}

            {!relayOffline && (
                <>
                    <div className="rounded-lg border overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b bg-muted/50">
                                    <tr>
                                        <th className="w-14 px-4 py-3 text-left text-sm font-medium whitespace-nowrap">ID</th>
                                        <th className="w-32 px-4 py-3 text-left text-sm font-medium whitespace-nowrap">{t('admin.col_name')}</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">{t('admin.col_title')}</th>
                                        <th className="w-40 px-4 py-3 text-left text-sm font-medium whitespace-nowrap">{t('admin.col_world')}</th>
                                        <th className="w-40 px-4 py-3 text-left text-sm font-medium whitespace-nowrap">{t('admin.col_owner')}</th>
                                        <th className="w-20 px-4 py-3 text-left text-sm font-medium whitespace-nowrap">{t('admin.col_capacity')}</th>
                                        <th className="w-36 px-4 py-3 text-left text-sm font-medium whitespace-nowrap">{t('admin.col_created')}</th>
                                        <th className="w-10 px-2 py-3" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {loading ? (
                                        Array.from({ length: limit }).map((_, i) => (
                                            <tr key={i}>
                                                <td className="px-4 py-3"><Skeleton className="h-4 w-8" /></td>
                                                <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                                                <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                                                <td className="px-4 py-3"><Skeleton className="h-6 w-32" /></td>
                                                <td className="px-4 py-3"><Skeleton className="h-6 w-32" /></td>
                                                <td className="px-4 py-3"><Skeleton className="h-4 w-10" /></td>
                                                <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                                                <td className="px-2 py-3" />
                                            </tr>
                                        ))
                                    ) : pageInstances.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">
                                                {t('admin.no_relay_instances')}
                                            </td>
                                        </tr>
                                    ) : (
                                        pageInstances.map(instance => (
                                            <tr
                                                key={instance.id}
                                                className={instance.internal_id !== null ? 'hover:bg-muted/50 cursor-pointer' : 'opacity-60'}
                                                onClick={() => instance.internal_id !== null && router.push(`/relays/${relayId}/instances/${instance.internal_id}`)}
                                            >
                                                <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{instance.id}</td>
                                                <td className="px-4 py-3 max-w-[8rem]"><span className="block text-sm font-mono truncate">{instance.name || '—'}</span></td>
                                                <td className="px-4 py-3 max-w-[12rem]"><span className="block text-sm truncate">{instance.title || '—'}</span></td>
                                                <td className="px-4 py-3">
                                                    <WorldCell identifier={instance.world} worldMap={worldMap} />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <UserCell identifier={instance.owner} userMap={userMap} />
                                                </td>
                                                <td className="px-4 py-3 text-sm text-muted-foreground">{instance.capacity === 0 ? t('world.unlimited') : instance.capacity}</td>
                                                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap" title={instance.created_at ? format(new Date(instance.created_at), 'PPPP p') : undefined}>
                                                    {instance.created_at ? formatDistanceToNow(new Date(instance.created_at), { addSuffix: true }) : '—'}
                                                </td>
                                                <td className="px-2 py-3" onClick={e => e.stopPropagation()}>
                                                    <InstanceActions relayId={relayId} internalId={instance.internal_id} />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                            {loading
                                ? <Skeleton className="h-4 w-28 inline-block" />
                                : t('admin.total_instances', { count: allInstances.length })}
                        </span>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" className="size-8"
                                onClick={() => setPage(1)} disabled={page <= 1 || loading}>
                                <Icon icon="material-symbols:keyboard-double-arrow-left-rounded" />
                            </Button>
                            <Button variant="outline" size="icon" className="size-8"
                                onClick={() => setPage(page - 1)} disabled={page <= 1 || loading}>
                                <Icon icon="material-symbols:chevron-left-rounded" />
                            </Button>
                            <span className="min-w-[80px] text-center font-medium">
                                {loading ? '\u2026' : `${page} / ${pageCount}`}
                            </span>
                            <Button variant="outline" size="icon" className="size-8"
                                onClick={() => setPage(page + 1)} disabled={page >= pageCount || loading}>
                                <Icon icon="material-symbols:chevron-right-rounded" />
                            </Button>
                            <Button variant="outline" size="icon" className="size-8"
                                onClick={() => setPage(pageCount)} disabled={page >= pageCount || loading}>
                                <Icon icon="material-symbols:keyboard-double-arrow-right-rounded" />
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function UserCell({ identifier, userMap }: { identifier: string | null; userMap: Map<string, ApiUser> }) {
    if (!identifier) return <span className="text-xs text-muted-foreground">\u2014</span>;
    const user = userMap.get(identifier);
    if (!user) return <span className="font-mono text-xs text-muted-foreground truncate block max-w-[8rem]">{identifier}</span>;
    const display = user.display || user.username;
    const initials = display?.slice(0, 2).toUpperCase() ?? '??';
    return (
        <div className="flex items-center gap-2 min-w-0">
            <Avatar className="size-6 shrink-0">
                {user.thumbnail && <AvatarImage src={user.thumbnail} alt={display} />}
                <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
            </Avatar>
            <span className="text-sm truncate">{display}</span>
        </div>
    );
}

function WorldCell({ identifier, worldMap }: { identifier: string | null; worldMap: Map<string, ApiWorld> }) {
    if (!identifier) return <span className="text-xs text-muted-foreground">\u2014</span>;
    const world = worldMap.get(identifier);
    if (!world) return <span className="font-mono text-xs text-muted-foreground truncate block max-w-[10rem]">{identifier}</span>;
    const initials = (world.title || world.name || '?').slice(0, 2).toUpperCase();
    return (
        <div className="flex items-center gap-2 min-w-0">
            <Avatar className="size-6 rounded-md shrink-0">
                {world.thumbnail && <AvatarImage src={world.thumbnail} alt={world.title} className="object-cover" />}
                <AvatarFallback className="text-[10px] rounded-md">
                    <Icon icon="material-symbols:public-rounded" className="size-3.5" />
                </AvatarFallback>
            </Avatar>
            <span className="text-sm truncate">{world.title || world.name}</span>
        </div>
    );
}

function InstanceActions({ relayId, internalId }: { relayId: number; internalId: number | null }) {
    const router = useRouter();
    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                className="inline-flex items-center justify-center rounded-md size-7 hover:bg-accent hover:text-accent-foreground transition-colors"
            >
                <Icon icon="material-symbols:more-vert" className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                    className="text-xs"
                    disabled={internalId === null}
                    onClick={() => internalId !== null && router.push(`/relays/${relayId}/instances/${internalId}/players`)}
                >
                    <Icon icon="material-symbols:groups-rounded" className="size-3.5" />
                    View Players
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
