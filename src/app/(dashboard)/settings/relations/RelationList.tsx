'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { Button, buttonVariants } from '@/components/ui/button';
import { useApi } from '@/lib/api/context';
import { getFollowers, getFollowing, getFriends, getUser, respondToRequest } from '@/lib/api/users';
import type { ApiUser } from '@/types/api';
import { getAlias } from '@/lib/api';
import { noxIdToSegment } from '@/types/nox-identifier';
import { ResultList, SkeletonList, EmptyBox, PageNav } from '@/components/shared/ResultGrid';
import { AvatarWithPresence } from '@/components/ui/avatar-with-presence';
import { notify } from '@/components/ui/notify';
import { cn } from '@/lib/utils';

export type RelationTabKey = 'followers' | 'following' | 'friends' | 'pending';

// ── User Row ─────────────────────────────────────────────────────────────────

function UserRow({ user: u, localAddress }: { user: ApiUser; localAddress: string }) {
    const displayName = u.display || u.username || '?';
    const identifier = getAlias(u.alias, 'uid') || getAlias(u.alias, 'iid') || '';
    const rawId = getAlias(u.alias, 'uid') ?? getAlias(u.alias, 'iid') ?? `${u.id}@${u.server}`;
    const href = `/u/${noxIdToSegment(rawId, localAddress)}`;

    return (
        <Link
            href={href}
            className={cn(
                buttonVariants({ variant: 'outline', size: 'default' }),
                'w-full justify-start h-auto py-3 px-6 flex items-center gap-4',
            )}
        >
            <AvatarWithPresence
                presence={u.presence.status}
                size="lg"
                src={u.thumbnail}
                alt={displayName}
                name={displayName}
                letterClassName="text-lg"
                avatarClassName="h-12 w-12"
            />
            <div className="min-w-0">
                <p className="font-bold text-lg">{displayName}</p>
                {identifier && (
                    <p className="text-sm text-muted-foreground">{identifier}</p>
                )}
            </div>
        </Link>
    );
}

// ── Pending Row (with accept/reject actions) ─────────────────────────────────

function PendingRow({ user: u, onAccept, onReject }: {
    user: ApiUser;
    onAccept: () => void;
    onReject: () => void;
}) {
    const { t } = useTranslation();
    const displayName = u.display || u.username || '?';
    const identifier = getAlias(u.alias, 'uid') || getAlias(u.alias, 'iid') || '';

    return (
        <div
            className={cn(
                buttonVariants({ variant: 'outline', size: 'default' }),
                'w-full justify-start h-auto py-3 px-6 flex items-center gap-4 cursor-default hover:bg-background',
            )}
        >
            <AvatarWithPresence
                presence={u.presence.status}
                size="lg"
                src={u.thumbnail}
                alt={displayName}
                name={displayName}
                letterClassName="text-lg"
                avatarClassName="h-12 w-12"
            />
            <div className="min-w-0 flex-1">
                <p className="font-bold text-lg">{displayName}</p>
                {identifier && (
                    <p className="text-sm text-muted-foreground">{identifier}</p>
                )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={onAccept}>
                    <Icon icon="material-symbols:check-rounded" className="size-4 mr-1" />
                    {t('relations.accept')}
                </Button>
                <Button variant="outline" size="sm" onClick={onReject}
                    className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive">
                    <Icon icon="material-symbols:close-rounded" className="size-4 mr-1" />
                    {t('relations.reject')}
                </Button>
            </div>
        </div>
    );
}

// ── List ─────────────────────────────────────────────────────────────────────

/**
 * Renders one relation list (followers / following / friends / pending), filtered by
 * `query`. Used by the four dedicated pages, which own the search box (in the title bar).
 */
export function RelationList({ tab, query = '' }: { tab: RelationTabKey; query?: string }) {
    const { t } = useTranslation();
    const { currentUser, wellKnown } = useApi();
    const localAddress = wellKnown?.address ?? '::';

    const [items, setItems] = useState<ApiUser[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const limit = 20;

    const load = useCallback(async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const offset = (page - 1) * limit;

            if (tab === 'followers') {
                const res = await getFollowers(currentUser.id, limit, offset);
                const refs = res.items.map(r => r.initiator);
                const settled = await Promise.allSettled(refs.map(ref => getUser(ref)));
                setItems(settled.filter((r): r is PromiseFulfilledResult<ApiUser> => r.status === 'fulfilled').map(r => r.value));
                setTotal(res.total);
            } else if (tab === 'following') {
                const res = await getFollowing(currentUser.id, limit, offset);
                const refs = res.items.map(r => r.target);
                const settled = await Promise.allSettled(refs.map(ref => getUser(ref)));
                setItems(settled.filter((r): r is PromiseFulfilledResult<ApiUser> => r.status === 'fulfilled').map(r => r.value));
                setTotal(res.total);
            } else if (tab === 'friends') {
                const res = await getFriends(currentUser.id, limit, offset);
                const refs = res.items.map(r => r.out.target);
                const settled = await Promise.allSettled(refs.map(ref => getUser(ref)));
                setItems(settled.filter((r): r is PromiseFulfilledResult<ApiUser> => r.status === 'fulfilled').map(r => r.value));
                setTotal(res.total);
            } else if (tab === 'pending') {
                // Pending: incoming relations with type=REQUEST
                const res = await getFollowers(currentUser.id, 100, 0);
                const pendingRefs = res.items
                    .filter(r => r.type === 'request')
                    .map(r => r.initiator);
                setTotal(pendingRefs.length);
                const settled = await Promise.allSettled(
                    pendingRefs.slice(offset, offset + limit).map(ref => getUser(ref))
                );
                setItems(settled.filter((r): r is PromiseFulfilledResult<ApiUser> => r.status === 'fulfilled').map(r => r.value));
            }
        } catch {
            setItems([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [currentUser, tab, page]);

    useEffect(() => { load(); }, [load]);

    const handleAccept = async (initiatorRef: string) => {
        try {
            await respondToRequest(initiatorRef, true);
            notify(t('relations.request_accepted'), { type: 'success' });
            load();
        } catch (err) {
            notify((err as Error)?.message ?? t('common.error'), { type: 'danger' });
        }
    };

    const handleReject = async (initiatorRef: string) => {
        try {
            await respondToRequest(initiatorRef, false);
            notify(t('relations.request_rejected'), { type: 'success' });
            load();
        } catch (err) {
            notify((err as Error)?.message ?? t('common.error'), { type: 'danger' });
        }
    };

    const filtered = query
        ? items.filter(u =>
            (u.display || u.username || '').toLowerCase().includes(query.toLowerCase())
        )
        : items;

    let content;
    if (loading) {
        content = <SkeletonList count={5} />;
    } else if (items.length === 0) {
        content = <EmptyBox>{t(`relations.empty_${tab}`)}</EmptyBox>;
    } else if (filtered.length === 0) {
        content = <EmptyBox>{t('common.no_results')}</EmptyBox>;
    } else {
        content = (
            <div className="space-y-4">
                <ResultList>
                    {filtered.map((u) => {
                        if (tab === 'pending') {
                            const ref = getAlias(u.alias, 'uid') || getAlias(u.alias, 'iid') || '';
                            return (
                                <PendingRow
                                    key={u.id}
                                    user={u}
                                    onAccept={() => handleAccept(ref)}
                                    onReject={() => handleReject(ref)}
                                />
                            );
                        }
                        return <UserRow key={u.id} user={u} localAddress={localAddress} />;
                    })}
                </ResultList>
                <PageNav page={page} total={total} limit={limit} onPage={setPage} />
            </div>
        );
    }

    return content;
}
