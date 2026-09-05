import { searchUsers } from '@/lib/api/users';
import { getWorld, searchWorlds } from '@/lib/api/worlds';
import { searchAvatars } from '@/lib/api/avatars';
import { searchInstances } from '@/lib/api/instances';
import { searchServers } from '@/lib/api/servers';
import { getAlias } from '@/lib/api';
import { noxIdToSegment } from '@/types/nox-identifier';
import type { ApiSearchResult, ResultItem } from '@/types/api';

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

export const SEARCH_TABS: TabDef[] = [
    {
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
                        thumbnail: u.thumbnail,
                        description:
                            getAlias(u.alias, 'uid') || getAlias(u.alias, 'iid'),
                    };
                }),
            };
        },
    },
    {
        feature: 'world',
        path: '/worlds',
        title: 'search.tab_worlds',
        icon: 'material-symbols:public',
        layout: 'card',
        fetchResults: async (localAddress, query, limit, offset) => {
            const data = await searchWorlds(query, limit, offset);
            return {
                total: data.total,
                limit: data.limit,
                offset: data.offset,
                items: data.items.map((w) => {
                    const id =
                        getAlias(w.alias, 'nid') ??
                        getAlias(w.alias, 'iid') ??
                        `${w.id}@${w.server}`;
                    return {
                        id,
                        name: w.title,
                        thumbnail: w.thumbnail,
                        description: id,
                        redirect: `/w/${noxIdToSegment(id, localAddress)}`,
                    };
                }),
            };
        },
    },
    {
        feature: 'avatar',
        path: '/avatars',
        title: 'search.tab_avatars',
        icon: 'material-symbols:person-rounded',
        layout: 'card',
        fetchResults: async (localAddress, query, limit, offset) => {
            const data = await searchAvatars(query, limit, offset);
            return {
                total: data.total,
                limit: data.limit,
                offset: data.offset,
                items: data.items.map((a) => {
                    const id =
                        getAlias(a.alias, 'nid') ??
                        getAlias(a.alias, 'iid') ??
                        `${a.id}@${a.server}`;
                    return {
                        id,
                        name: a.title,
                        thumbnail: a.thumbnail,
                        description: id,
                        redirect: `/a/${noxIdToSegment(id, localAddress)}`,
                    };
                }),
            };
        },
    },
    {
        feature: 'instance',
        path: '/instances',
        title: 'search.tab_instances',
        icon: 'material-symbols:location-on-rounded',
        layout: 'card',
        fetchResults: async (localAddress, query, limit, offset) => {
            const data = await searchInstances(query, limit, offset);
            // Batch fetch worlds for all instances
            const instanceWorldIds = Array.from(new Set(data.items.map(i => i.world)));
            const worldMap = new Map<string, { title: string | null; thumbnail: string | null }>();

            await Promise.all(
                instanceWorldIds.map(async (worldId) => {
                    try {
                        const world = await getWorld(worldId);
                        worldMap.set(worldId, {
                            title: world.title,
                            thumbnail: world.thumbnail,
                        });
                    } catch {
                        worldMap.set(worldId, { title: null, thumbnail: null });
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
                    const world = worldMap.get(i.world) || { title: null, thumbnail: null };
                    return {
                        id,
                        name: i.title ?? world.title,
                        thumbnail: i.thumbnail ?? world.thumbnail,
                        description: id,
                        redirect: `/i/${noxIdToSegment(id, localAddress)}`,
                    };
                }),
            };
        },
    },
    {
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
                        thumbnail: wm?.icon ?? null,
                        description: wm?.description ?? (wm?.title ? s.address : null),
                        redirect: `/s/${s.address}`,
                    };
                }),
            };
        },
    },
];