'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { getRelayClients, batchGetUsers } from '@/lib/api';
import type { ApiRelayClient, ApiUser, ApiUserSearchResult } from '@/types/api';
import { ApiError } from '@/types/envelope';
import { useWsEvent } from '@/lib/ws/context';
import { useTranslation } from 'react-i18next';
import { usePagination } from '@/hooks/usePagination';
import { Icon } from '@iconify/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow, format } from 'date-fns';

export default function RelayClientsPage() {
    const params = useParams<{ id: string }>();
    const relayId = parseInt(params.id, 10);
    const { t } = useTranslation();
    const { page, limit, setPage } = usePagination();

    const [allClients, setAllClients] = useState<ApiRelayClient[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | undefined>();
    const [relayOffline, setRelayOffline] = useState(false);
    const [userMap, setUserMap] = useState<Map<string, ApiUser>>(new Map());
    const fetchedUsersRef = useRef<Set<string>>(new Set());
    const loadedRef = useRef(false);

    const fetchClients = useCallback(async () => {
        setLoading(true);
        setError(undefined);
        setRelayOffline(false);
        try {
            const res = await getRelayClients(relayId, 1000, 0);
            const sorted = (res.items ?? []).slice().sort((a, b) => b.connected_at - a.connected_at);
            setAllClients(sorted);
        } catch (e) {
            if (e instanceof ApiError && e.status === 503) {
                setRelayOffline(true);
            } else {
                setError(e instanceof Error ? e.message : 'Failed to load clients');
            }
        } finally {
            setLoading(false);
        }
    }, [relayId]);

    useEffect(() => {
        if (loadedRef.current) return;
        loadedRef.current = true;
        fetchClients();
    }, [fetchClients]);

    const pageClients = useMemo(() => {
        const start = (page - 1) * limit;
        return allClients.slice(start, start + limit);
    }, [allClients, page, limit]);
    const pageCount = Math.max(1, Math.ceil(allClients.length / limit));

    useEffect(() => {
        const toFetch = pageClients
            .map(c => c.user)
            .filter((u): u is string => !!u && !fetchedUsersRef.current.has(u));
        if (toFetch.length === 0) return;
        for (const id of toFetch) fetchedUsersRef.current.add(id);
        batchGetUsers(toFetch)
            .then((res: ApiUserSearchResult) => {
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
    }, [pageClients]); // eslint-disable-line react-hooks/exhaustive-deps

    useWsEvent('relay_client_connected', (payload: unknown) => {
        const data = payload as { relay_id: number; client: ApiRelayClient };
        if (data.relay_id !== relayId) return;
        setAllClients(prev => [data.client, ...prev.filter(c => c.id !== data.client.id)]);
    });

    useWsEvent('relay_client_authentified', (payload: unknown) => {
        const data = payload as { relay_id: number; client_id: number; user: string };
        if (data.relay_id !== relayId) return;
        setAllClients(prev => prev.map(c => c.id === data.client_id ? { ...c, user: data.user } : c));
    });

    useWsEvent('relay_client_disconnected', (payload: unknown) => {
        const data = payload as { relay_id: number; id: number };
        if (data.relay_id !== relayId) return;
        setAllClients(prev => prev.filter(c => c.id !== data.id));
    });

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
                                        <th className="w-44 px-4 py-3 text-left text-sm font-medium whitespace-nowrap">{t('admin.col_address')}</th>
                                        <th className="w-28 px-4 py-3 text-left text-sm font-medium whitespace-nowrap">{t('admin.col_platform')}</th>
                                        <th className="w-24 px-4 py-3 text-left text-sm font-medium whitespace-nowrap">{t('admin.col_engine')}</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium whitespace-nowrap">{t('admin.col_user')}</th>
                                        <th className="w-36 px-4 py-3 text-left text-sm font-medium whitespace-nowrap">{t('admin.col_connected_at')}</th>
                                        <th className="w-10 px-2 py-3" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {loading ? (
                                        Array.from({ length: limit }).map((_, i) => (
                                            <tr key={i}>
                                                <td className="px-4 py-3"><Skeleton className="h-4 w-8" /></td>
                                                <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                                                <td className="px-4 py-3"><Skeleton className="h-5 w-20" /></td>
                                                <td className="px-4 py-3"><Skeleton className="h-5 w-16" /></td>
                                                <td className="px-4 py-3"><Skeleton className="h-6 w-36" /></td>
                                                <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                                                <td className="px-2 py-3" />
                                            </tr>
                                        ))
                                    ) : pageClients.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                                                {t('admin.no_relay_clients')}
                                            </td>
                                        </tr>
                                    ) : (
                                        pageClients.map(client => (
                                            <tr key={client.id} className="hover:bg-muted/50">
                                                <td className="px-4 py-3 font-mono text-sm text-muted-foreground">{client.id}</td>
                                                <td className="px-4 py-3 font-mono text-xs text-muted-foreground truncate max-w-[11rem]">{client.address || '—'}</td>
                                                <td className="px-4 py-3"><PlatformBadge value={client.platform} /></td>
                                                <td className="px-4 py-3"><EngineBadge value={client.engine} /></td>
                                                <td className="px-4 py-3"><UserCell identifier={client.user} userMap={userMap} /></td>
                                                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap" title={client.connected_at ? format(new Date(client.connected_at), 'PPPP p') : undefined}>
                                                    {client.connected_at ? formatDistanceToNow(new Date(client.connected_at), { addSuffix: true }) : '—'}
                                                </td>
                                                <td className="px-2 py-3">
                                                    <ClientActions clientId={client.id} relayId={relayId} />
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
                                ? <Skeleton className="h-4 w-24 inline-block" />
                                : `${allClients.length} client${allClients.length !== 1 ? 's' : ''}`}
                        </span>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" className="size-8"
                                onClick={() => setPage(1)} disabled={page <= 1}>
                                <Icon icon="material-symbols:keyboard-double-arrow-left-rounded" />
                            </Button>
                            <Button variant="outline" size="icon" className="size-8"
                                onClick={() => setPage(page - 1)} disabled={page <= 1}>
                                <Icon icon="material-symbols:chevron-left-rounded" />
                            </Button>
                            <span className="min-w-[80px] text-center font-medium">
                                {page} / {pageCount}
                            </span>
                            <Button variant="outline" size="icon" className="size-8"
                                onClick={() => setPage(page + 1)} disabled={page >= pageCount}>
                                <Icon icon="material-symbols:chevron-right-rounded" />
                            </Button>
                            <Button variant="outline" size="icon" className="size-8"
                                onClick={() => setPage(pageCount)} disabled={page >= pageCount}>
                                <Icon icon="material-symbols:keyboard-double-arrow-right-rounded" />
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function PlatformBadge({ value }: { value: string }) {
    if (!value) return <span className="text-xs text-muted-foreground">—</span>;
    const v = value.toLowerCase();
    const icon = v.includes('windows') ? 'mdi:microsoft-windows'
        : v.includes('android') ? 'mdi:android'
        : v.includes('ios') || v.includes('iphone') || v.includes('mac') ? 'mdi:apple'
        : v.includes('linux') ? 'mdi:linux'
        : 'mdi:devices';
    return (
        <Badge variant="secondary" className="gap-1 capitalize">
            <Icon icon={icon} className="size-3" />
            {value}
        </Badge>
    );
}

function EngineBadge({ value }: { value: string }) {
    if (!value) return <span className="text-xs text-muted-foreground">—</span>;
    const v = value.toLowerCase();
    const icon = v.includes('unity') ? 'simple-icons:unity'
        : v.includes('unreal') ? 'simple-icons:unrealengine'
        : 'mdi:code-braces';
    return (
        <Badge variant="outline" className="gap-1 capitalize">
            <Icon icon={icon} className="size-3" />
            {value}
        </Badge>
    );
}

function UserCell({ identifier, userMap }: { identifier: string | null; userMap: Map<string, ApiUser> }) {
    if (!identifier) return <span className="text-xs text-muted-foreground">—</span>;
    const user = userMap.get(identifier);
    if (!user) return <span className="font-mono text-xs text-muted-foreground">{identifier}</span>;
    const initials = (user.display ?? user.username).slice(0, 2).toUpperCase();
    return (
        <Link href={`/u/${user.username}`} className="flex items-center gap-2 w-fit hover:underline underline-offset-2">
            <Avatar className="size-6 shrink-0">
                <AvatarImage src={user.thumbnail ?? undefined} alt={user.display} />
                <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{user.display}</span>
        </Link>
    );
}

function ClientActions({ clientId, relayId }: { clientId: number; relayId: number }) {
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
                    onClick={() => navigator.clipboard.writeText(String(clientId))}
                >
                    <Icon icon="material-symbols:content-copy-outline-rounded" className="size-3.5" />
                    Copy ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs text-destructive focus:text-destructive" disabled>
                    <Icon icon="material-symbols:close-rounded" className="size-3.5" />
                    Disconnect
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
