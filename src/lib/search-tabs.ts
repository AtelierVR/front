import { searchUsers } from '@/lib/api/users';
import { getWorld } from '@/lib/api/worlds';
import { searchInstances } from '@/lib/api/instances';
import { searchServers } from '@/lib/api/servers';
import { instanceAssets, searchAssets } from '@/lib/api/assets';
import { getAlias } from '@/lib/api';
import { noxIdToSegment } from '@/types/nox-identifier';
import { imageList } from '@/types/api';
import type { InstanceConfig } from '@/lib/api/configs';
import type { ApiAsset, ApiConfigAsset, ApiSearchResult, ApiWorld } from '@/types/api';
import type { ResultItem } from '@/components/shared/ResultGrid';

export const DEFAULT_TAB = 'user';

export interface TabDef {
    feature: string;
    path: string;
    title?: string;
    icon: string;
    layout: 'card' | 'list';
    fetchResults: (
        localAddress: string,
        query: string,
        limit: number,
        offset: number,
    ) => Promise<ApiSearchResult<ResultItem>>;
}

/**
 * Search tabs of an instance.
 *
 * Only the kinds that are not assets (user, instance, server) are declared here:
 * one tab is **generated** per asset kind the instance serves — see
 * `GET /configs`, `assets` — using its `type`, `key` and `endpoint`, so a node
 * serving other kinds (or another set of kinds) needs no front change.
 */

/**
 * Icons of the built-in asset kinds. A kind the front does not know yet gets a
 * generic icon; its label is `search.tab_<endpoint>`, falling back to the kind.
 */
const ASSET_TAB_ICONS: Record<string, string> = {
    world: 'material-symbols:public',
    avatar: 'material-symbols:person-rounded',
    mod: 'material-symbols:package-2-rounded',
};

const DEFAULT_ASSET_TAB_ICON = 'material-symbols:category-rounded';

/** Grid item of an asset, whatever its kind. */
function assetToResultItem(asset: ApiAsset, kind: ApiConfigAsset, localAddress: string): ResultItem {
    const id =
        getAlias(asset.alias, 'nid') ??
        getAlias(asset.alias, 'iid') ??
        `${asset.id}@${asset.server}`;
    return {
        id,
        name: asset.title ?? asset.name ?? id,
        images: imageList(asset.images),
        description: id,
        redirect: `/${kind.key}/${noxIdToSegment(id, localAddress)}`,
    };
}

/** Tab of an asset kind, built from its instance declaration. */
function assetTab(kind: ApiConfigAsset): TabDef {
    return {
        feature: kind.type,
        path: `/${kind.endpoint}`,
        title: `search.tab_${kind.endpoint}`,
        icon: ASSET_TAB_ICONS[kind.type] ?? DEFAULT_ASSET_TAB_ICON,
        layout: 'card',
        fetchResults: async (localAddress, query, limit, offset) => {
            const data = await searchAssets(kind.endpoint, query, limit, offset);
            return {
                total: data.total,
                limit: data.limit,
                offset: data.offset,
                items: data.items.map((asset) => assetToResultItem(asset, kind, localAddress)),
            };
        },
    };
}

const USER_TAB: TabDef = {
    feature: 'user',
    path: '/users',
    title: 'search.tab_users',
    icon: 'material-symbols:person-rounded',
    layout: 'list',
    fetchResults: async (localAddress, query, limit, offset) => {
        const data = await searchUsers(query, limit, offset);
        return {
            total: data.total,
            limit: data.limit,
            offset: data.offset,
            items: data.items.map((u) => {
                const id =
                    getAlias(u.alias, 'uid') ??
                    getAlias(u.alias, 'iid') ??
                    `${u.id}@${u.server}`;
                return {
                    id: u.id.toString(),
                    redirect: `/u/${noxIdToSegment(id, localAddress)}`,
                    name: u.display,
                    images: imageList(u.thumbnail),
                    description:
                        getAlias(u.alias, 'uid') || getAlias(u.alias, 'iid'),
                };
            }),
        };
    },
};

const INSTANCE_TAB: TabDef = {
    feature: 'instance',
    path: '/instances',
    title: 'search.tab_instances',
    icon: 'material-symbols:location-on-rounded',
    layout: 'card',
    fetchResults: async (localAddress, query, limit, offset) => {
        const data = await searchInstances(query, limit, offset);
        // Batch fetch worlds for all instances
        const instanceWorldIds = Array.from(new Set(data.items.map(i => i.world)));
        const worldMap = new Map<string, ApiWorld>();

        await Promise.all(
            instanceWorldIds.map(async (worldId) => {
                try {
                    worldMap.set(worldId, await getWorld(worldId));
                } catch {
                    // World unavailable: the instance is listed on its own.
                }
            })
        );

        return {
            total: data.total,
            limit: data.limit,
            offset: data.offset,
            items: data.items.map((i) => {
                const id =
                    getAlias(i.alias, 'nid') || getAlias(i.alias, 'iid') || `${i.id}@${i.server}`;
                const world = worldMap.get(i.world);
                return {
                    id,
                    name: i.title ?? world?.title ?? null,
                    images: [...imageList(i.thumbnail), ...imageList(world?.images)],
                    description: id,
                    redirect: `/i/${noxIdToSegment(id, localAddress)}`,
                };
            }),
        };
    },
};

const SERVER_TAB: TabDef = {
    feature: 'server',
    path: '/servers',
    title: 'search.tab_servers',
    icon: 'material-symbols:dns',
    layout: 'list',
    fetchResults: async (localAddress, query, limit, offset) => {
        const data = await searchServers(query, limit, offset);
        return {
            total: data.total,
            limit: data.limit,
            offset: data.offset,
            items: data.items.map((s) => {
                const wm = s.well_known?.metadata;
                return {
                    id: s.address,
                    name: wm?.title ?? s.address,
                    images: [],
                    icon: wm?.icon ?? null,
                    description: wm?.description ?? (wm?.title ? s.address : null),
                    redirect: `/s/${s.address}`,
                };
            }),
        };
    },
};

/** Tabs of the instance, asset tabs included, in display order. */
export function searchTabs(config: InstanceConfig | null | undefined): TabDef[] {
    return [
        USER_TAB,
        ...instanceAssets(config).map(assetTab),
        INSTANCE_TAB,
        SERVER_TAB,
    ];
}
