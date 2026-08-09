'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from './UserContext';
import { getFollowers, getFollowing, batchGetUsers } from '@/lib/api/users';
import { usePagination } from '@/hooks/usePagination';
import type { ApiUser } from '@/types/api';
import { SkeletonList, EmptyState, PageNav, ResultList } from '@/components/shared/ResultGrid';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getAlias } from '@/lib/api';
import Link from 'next/link';

interface Props {
    mode: 'followers' | 'following';
}

function UserRow({ u }: { u: ApiUser }) {
    const [imgError, setImgError] = useState(false);
    const displayName = u.display || u.username || '?';
    const initial = displayName.charAt(0).toUpperCase();

    return (
        <Link
            href={`/u/${u.username}`}
            className={cn(
                buttonVariants({ variant: 'outline', size: 'default' }),
                'w-full justify-start h-auto py-3 px-6 flex items-center gap-4',
            )}
        >
            <div className="h-12 w-12 rounded-full overflow-hidden flex-shrink-0 bg-muted flex items-center justify-center">
                {u.thumbnail && !imgError ? (
                    <img
                        src={u.thumbnail}
                        alt={displayName}
                        className="h-full w-full object-cover"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <span className="text-lg font-semibold text-muted-foreground select-none">
                        {initial}
                    </span>
                )}
            </div>
            <div>
                <p className="font-bold text-lg">{displayName}</p>
                <p className="text-sm text-muted-foreground">{getAlias(u.alias, 'uid') || getAlias(u.alias, 'iid')}</p>
            </div>
        </Link>
    );
}

export function UserFollowList({ mode }: Props) {
    const { user } = useUser();
    const { t } = useTranslation();
    const { page, limit, offset, setPage } = usePagination();

    const [items, setItems] = useState<ApiUser[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        let cancelled = false;
        setLoading(true);
        setError(null);

        const userRef = getAlias(user.alias, 'uid') || getAlias(user.alias, 'iid') || `${user.id}@${user.server}`;
        const fetchFn = mode === 'followers'
            ? getFollowers(userRef, limit, offset)
            : getFollowing(userRef, limit, offset);

        fetchFn
            .then(async (res) => {
                if (cancelled) return;
                // following: target is the other user; followers: initiator is the other user
                const refs = res.items.map(r => mode === 'following' ? r.target : r.initiator);
                if (refs.length === 0) {
                    setItems([]);
                    setTotal(res.total);
                    return;
                }
                const batch = await batchGetUsers(refs);
                if (!cancelled) {
                    setItems(batch.items);
                    setTotal(res.total);
                }
            })
            .catch(() => { if (!cancelled) setError('error'); })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, [user?.id, mode, page, limit, offset]);

    if (loading) return <SkeletonList count={5} />;

    if (error) return <EmptyState label={t('common.error')} />;

    if (items.length === 0)
        return <EmptyState label={t(mode === 'followers' ? 'users.no_followers' : 'users.no_following')} />;

    return (
        <div className="space-y-4">
            <ResultList>
                {items.map((u) => (
                    <UserRow key={u.id} u={u} />
                ))}
            </ResultList>
            <PageNav page={page} total={total} limit={limit} onPage={setPage} />
        </div>
    );
}
