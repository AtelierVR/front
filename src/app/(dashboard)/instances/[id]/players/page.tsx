'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo, useRef, Suspense } from 'react';
import { getInstance } from '@/lib/api/instances';
import { batchGetUsers } from '@/lib/api/users';
import type { ApiInstance, ApiUser } from '@/types/api';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SiteHeader } from '@/components/site-header';
import { usePagination } from '@/hooks/usePagination';

export default function InstancePlayersPage() {
    return (
        <Suspense fallback={<div className="p-4 md:p-6"><Skeleton className="h-64 w-full" /></div>}>
            <InstancePlayersInner />
        </Suspense>
    );
}

function InstancePlayersInner() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const { t } = useTranslation();
    const { page, limit, setPage } = usePagination();

    const [instance, setInstance] = useState<ApiInstance | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | undefined>();
    const [userMap, setUserMap] = useState<Map<string, ApiUser>>(new Map());
    const fetchedUsersRef = useRef<Set<string>>(new Set());

    const fetchInstance = useCallback(async () => {
        setLoading(true);
        setError(undefined);
        try {
            const data = await getInstance(params.id);
            setInstance(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load instance');
        } finally {
            setLoading(false);
        }
    }, [params.id]);

    useEffect(() => { void fetchInstance(); }, [fetchInstance]);

    const allPlayers = instance?.players ?? [];
    const pagePlayers = useMemo(() => {
        const start = (page - 1) * limit;
        return allPlayers.slice(start, start + limit);
    }, [allPlayers, page, limit]);
    const pageCount = Math.max(1, Math.ceil(allPlayers.length / limit));

    // Batch-fetch user info for visible players
    useEffect(() => {
        const toFetch = pagePlayers
            .map(p => p.user)
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
    }, [pagePlayers]); // eslint-disable-line react-hooks/exhaustive-deps

    const instanceLabel = instance?.title || instance?.name || `Instance #${params.id}`;

    return (
        <>
            <SiteHeader
                before={
                    <Button variant="ghost" size="icon-sm" onClick={() => router.push(`/instances/${params.id}`)} aria-label="Back">
                        <Icon icon="material-symbols:arrow-back-rounded" className="size-4" />
                    </Button>
                }
                subtitle={loading ? undefined : <span className="text-muted-foreground">{instanceLabel}</span>}
                after={
                    <Button variant="ghost" size="icon-sm" onClick={() => void fetchInstance()} disabled={loading} aria-label="Refresh">
                        <Icon icon="material-symbols:refresh-rounded" className={loading ? 'animate-spin' : ''} />
                    </Button>
                }
            >
                {t('admin.instance_players')}
            </SiteHeader>

            <div className="flex flex-1 flex-col p-4 md:p-6 gap-4">
                {error && (
                    <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
                        <p className="text-sm text-destructive">{error}</p>
                    </div>
                )}

                <div className="rounded-lg border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium">{t('admin.col_display')}</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">{t('admin.col_user')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {loading ? (
                                    Array.from({ length: limit }).map((_, i) => (
                                        <tr key={i}>
                                            <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                                            <td className="px-4 py-3"><Skeleton className="h-6 w-40" /></td>
                                        </tr>
                                    ))
                                ) : pagePlayers.length === 0 ? (
                                    <tr>
                                        <td colSpan={2} className="px-4 py-12 text-center text-sm text-muted-foreground">
                                            {t('admin.no_instance_players')}
                                        </td>
                                    </tr>
                                ) : (
                                    pagePlayers.map((player, i) => (
                                        <tr key={i} className="hover:bg-muted/50">
                                            <td className="px-4 py-3 text-sm">{player.display || '—'}</td>
                                            <td className="px-4 py-3">
                                                <UserCell identifier={player.user} userMap={userMap} />
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
                            : `${allPlayers.length} player${allPlayers.length !== 1 ? 's' : ''}`}
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
                            {loading ? '…' : `${page} / ${pageCount}`}
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
            </div>
        </>
    );
}

function UserCell({ identifier, userMap }: { identifier: string | null; userMap: Map<string, ApiUser> }) {
    if (!identifier) {
        return <span className="text-xs text-muted-foreground">—</span>;
    }
    const user = userMap.get(identifier);
    if (!user) {
        return <span className="font-mono text-xs text-muted-foreground">{identifier}</span>;
    }
    const display = user.display || user.username;
    const initials = display?.slice(0, 2).toUpperCase() ?? '??';
    return (
        <div className="flex items-center gap-2">
            <Avatar className="size-6">
                {user.thumbnail && <AvatarImage src={user.thumbnail} alt={display} />}
                <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
            </Avatar>
            <span className="text-sm">{display}</span>
        </div>
    );
}
