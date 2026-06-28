'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from './UserContext';
import { listUserPublic, getUserPublicEntry } from '@/lib/api/users';
import { getWorld } from '@/lib/api/worlds';
import { getAvatar } from '@/lib/api/avatars';
import type { ApiWorld, ApiAvatar } from '@/types/api';
import type { NoxIdString } from '@/types/nox-identifier';
import { noxIdToSegment } from '@/types/nox-identifier';
import {
    ResultItem,
    ResultGrid,
    CardItem,
    SkeletonGrid,
    EmptyBox,
} from '@/components/shared/ResultGrid';
import { getAlias } from '@/lib/api';
import { useApi } from '@/lib/api/context';

interface FavoriteContent {
    label?: string;
    values: NoxIdString[];
}

interface ResolvedGroup {
    type: 'world' | 'avatar';
    index: number;
    label?: string;
    items: ResultItem[];
}

const FAVORITE_MIME = 'application/json+favorite';
const KEY_PREFIXES = ['public.favorites.'];

function parseFavoriteKey(key: string): { type: string; entryKey: string; index: number } | null {
    const prefix = KEY_PREFIXES.find(p => key.startsWith(p));
    if (!prefix) return null;
    const rest = key.slice(prefix.length); // "<type>.<group>"
    const dot = rest.indexOf('.');
    if (dot < 0) return null;
    const type = rest.slice(0, dot);
    const group = rest.slice(dot + 1);
    const index = parseInt(group, 10);
    return {
        type,
        entryKey: `favorites.${type}.${group}`,
        index
    };
}

function worldToResultItem(w: ApiWorld, localAddress: string): ResultItem {
    let id = getAlias(w.alias, 'nid') ?? getAlias(w.alias, 'iid') ?? `${w.id}@${w.server}`;
    return {
        id: id,
        name: w.title,
        thumbnail: w.thumbnail,
        description: id,
        redirect: `/w/${noxIdToSegment(id, localAddress)}`,
    };
}

function avatarToResultItem(a: ApiAvatar, localAddress: string): ResultItem {
    let id = getAlias(a.alias, 'nid') ?? getAlias(a.alias, 'iid') ?? `${a.id}@${a.server}`;
    return {
        id: id,
        name: a.title,
        thumbnail: a.thumbnail,
        description: id,
        redirect: `/a/${noxIdToSegment(id, localAddress)}`,
    };
}

export function UserFavorites() {
    const { user } = useUser();
    const { wellKnown } = useApi();
    const { t } = useTranslation();
    const [groups, setGroups] = useState<ResolvedGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const localAddress = wellKnown?.address ?? '::';

    useEffect(() => {
        if (!user) return;
        let cancelled = false;
        setLoading(true);

        listUserPublic(user.username)
            .then(async (list) => {
                const entries = list.items
                    .filter((item) => item.mime === FAVORITE_MIME)
                    .map((item) => parseFavoriteKey(item.key))
                    .filter((p): p is NonNullable<typeof p> => p !== null);

                const resolved = await Promise.allSettled(
                    entries.map(async ({ type, entryKey }) => {
                        const content = await getUserPublicEntry<FavoriteContent>(user.username, entryKey);
                        const values = Array.isArray(content?.values) ? content.values : [];

                        if (type === 'worlds') {
                            const settled = await Promise.allSettled(values.map(getWorld));
                            const items = settled
                                .filter((r): r is PromiseFulfilledResult<ApiWorld> => r.status === 'fulfilled')
                                .map((r) => worldToResultItem(r.value, localAddress));
                            return {
                                type: 'world',
                                label: content.label,
                                items,
                                index: parseFavoriteKey(entryKey)?.index ?? 0
                            } as ResolvedGroup;
                        }

                        if (type === 'avatars') {
                            const settled = await Promise.allSettled(values.map(getAvatar));
                            const items = settled
                                .filter((r): r is PromiseFulfilledResult<ApiAvatar> => r.status === 'fulfilled')
                                .map((r) => avatarToResultItem(r.value, localAddress));
                            return {
                                type: 'avatar',
                                label: content.label,
                                items,
                                index: parseFavoriteKey(entryKey)?.index ?? 0
                            } as ResolvedGroup;
                        }

                        return null;
                    }),
                );

                if (!cancelled) {
                    setGroups(
                        resolved
                            .filter((r): r is PromiseFulfilledResult<ResolvedGroup | null> => r.status === 'fulfilled')
                            .map((r) => r.value)
                            .filter((g): g is ResolvedGroup => g !== null && g.items.length > 0),
                    );
                }
            })
            .catch(() => { if (!cancelled) setGroups([]); })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, [user?.id, localAddress]);

    if (loading) {
        return <SkeletonGrid count={4} />;
    }

    if (groups.length === 0) {
        return (
            <EmptyBox>{t('users.favorites_empty')}</EmptyBox>
        );
    }

    return <div className="space-y-8">
        {groups.map((group, i) => (
            <section key={i} className="space-y-3">
                <h3 className="flex items-center justify-between text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    <span>{group.label ?? t(`users.favorites_${group.type}_label`, { index: group.index })}</span>
                    <span>{group.items.length}</span>
                </h3>
                <ResultGrid>
                    {group.items.map((item) => (
                        <CardItem key={item.id} {...item} />
                    ))}
                </ResultGrid>
            </section>
        ))}
    </div>;
}
