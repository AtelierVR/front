'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from './UserContext';
import { listUserPublic, getUserPublicEntry } from '@/lib/api/users';
import { assetByEndpoint, getAsset } from '@/lib/api/assets';
import { imageList } from '@/types/api';
import type { ApiAsset, ApiConfigAsset } from '@/types/api';
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
    /** Asset type of the group, used for the `users.favorites_<type>_label` label. */
    type: string;
    index: number;
    label?: string;
    items: ResultItem[];
}

const FAVORITE_MIME = 'application/json+favorite';
const KEY_PREFIXES = ['public.favorites.'];
const FAVORITE_FILTER = 'public.favorites.*';

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

/**
 * Local id of a stored favourite, or `null` when it lives on another server: the
 * asset endpoints only resolve the assets of this node.
 */
function localFavoriteId(value: NoxIdString, localAddress: string): string | null {
    const segment = noxIdToSegment(value, localAddress);
    return segment.includes('@') ? null : segment;
}

/** Turns an asset into the grid item it is displayed as. */
function assetToResultItem(asset: ApiAsset, kind: ApiConfigAsset, localAddress: string): ResultItem {
    const id = getAlias(asset.alias, 'nid') 
        ?? getAlias(asset.alias, 'iid') 
        ?? `${asset.id}@${asset.server}`;
    return {
        id,
        name: asset.title ?? asset.name ?? id,
        images: imageList(asset.images),
        description: id,
        redirect: `/${kind.key}/${noxIdToSegment(id, localAddress)}`,
    };
}

export function UserFavorites() {
    const { user } = useUser();
    const { wellKnown, config } = useApi();
    const { t } = useTranslation();
    const [groups, setGroups] = useState<ResolvedGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const localAddress = wellKnown?.address ?? '::';

    useEffect(() => {
        if (!user) return;
        let cancelled = false;
        setLoading(true);

        listUserPublic(user.username, FAVORITE_FILTER)
            .then(async (list) => {
                const entries = list.items
                    .filter((item) => item.mime === FAVORITE_MIME)
                    .map((item) => parseFavoriteKey(item.key))
                    .filter((p): p is NonNullable<typeof p> => p !== null);

                const resolved = await Promise.allSettled(
                    entries.map(async ({ type, entryKey, index }) => {
                        // Groups are stored under the asset endpoint (`favorites.worlds.0`);
                        // a kind the instance does not serve is skipped.
                        const kind = assetByEndpoint(config, type);
                        if (!kind) return null;

                        const content = await getUserPublicEntry<FavoriteContent>(user.username, entryKey);
                        const values = (Array.isArray(content?.values) ? content.values : [])
                            .map((value) => localFavoriteId(value, localAddress))
                            .filter((id): id is string => id !== null);

                        const settled = await Promise.allSettled(values.map((value) => getAsset(kind.endpoint, value)));
                        const items = settled
                            .filter((r): r is PromiseFulfilledResult<ApiAsset> => r.status === 'fulfilled')
                            .map((r) => assetToResultItem(r.value, kind, localAddress));

                        return {
                            type: kind.type,
                            label: content.label,
                            items,
                            index,
                        } as ResolvedGroup;
                    }),
                );

                if (!cancelled)
                    setGroups(
                        resolved
                            .filter((r): r is PromiseFulfilledResult<ResolvedGroup | null> => r.status === 'fulfilled')
                            .map((r) => r.value)
                            .filter((g): g is ResolvedGroup => g !== null && g.items.length > 0),
                    );
            })
            .catch(() => { if (!cancelled) setGroups([]); })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, [user?.id, localAddress, config]);

    if (loading)
        return <SkeletonGrid count={4} />;

    if (groups.length === 0)
        return (
            <EmptyBox>{t('users.favorites_empty')}</EmptyBox>
        );

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
