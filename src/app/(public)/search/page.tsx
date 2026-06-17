'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { useSearch } from '@/hooks/useSearch';
import { useApi } from '@/lib/api/context';
import { searchUsers } from '@/lib/api/users';
import { searchWorlds } from '@/lib/api/worlds';
import { searchAvatars } from '@/lib/api/avatars';
import { searchInstances } from '@/lib/api/instances';
import { searchServers } from '@/lib/api/servers';
import { resolveLocalized } from '@/lib/i18n/resolveLocalized';
import { resolveInstanceIcon } from '@/lib/useInstanceIcon';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PageTitle } from '@/components/shared/PageTitle';
import type { ApiSearchResult } from '@/types/api';
import { getAlias } from '@/lib/api';
import { noxIdToSegment } from '@/types/nox-identifier';
import {
    ResultItem,
    ResultGrid,
    ResultList,
    SkeletonGrid,
    SkeletonList,
    EmptyState,
    PageNav,
    CardItem,
    ListItem,
} from '@/components/shared/ResultGrid';

// ── Tab definitions ──────────────────────────────────────────────────────────
// Each tab is gated by the corresponding server feature flag.
// Feature values come from instance.features in the server config
// (e.g. "user,world,avatar,instance,server").

type TabKey = string;

interface TabDef {
    key: string;
    /** Feature flag that must be present in wk.features to show this tab. */
    feature: string;
    /** API path segment (no /api/ prefix — gateway.api already includes it). */
    path: string;
    /** i18n key for tab title (e.g. "search.tab_users") */
    title?: string;
    /** Optional icon to show in tab trigger */
    icon: string;
    /** Layout hint for results (e.g. "card" or "list") */
    layout: 'card' | 'list';
    /** Function to fetch results for this tab, given query/limit/offset. */
    fetchResults: (query: string, limit: number, offset: number) => Promise<ApiSearchResult<ResultItem>>;
}

interface SearchResults {
    [key: string]: ApiSearchResult<ResultItem> | Error | undefined;
}

function buildTabs(localAddress: string, locale: string): TabDef[] {
    return [
        {
            key: 'users',
            feature: 'user',
            path: '/users',
            title: 'search.tab_users',
            icon: 'material-symbols:person-rounded',
            layout: 'list',
            fetchResults: async (query, limit, offset) => {
                const data = await searchUsers(query, limit, offset);
                return {
                    total: data.total,
                    limit: data.limit,
                    offset: data.offset,
                    items: data.items.map((u) => {
                        let id = getAlias(u.alias, 'uid') ?? getAlias(u.alias, 'iid') ?? `${u.id}@${u.server}`;
                        return {
                            id: u.id.toString(),
                            redirect: `/u/${noxIdToSegment(id, localAddress)}`,
                            name: u.display,
                            thumbnail: u.thumbnail,
                            description: getAlias(u.alias, 'uid') || getAlias(u.alias, 'iid'),
                        }
                    }),
                };
            },
        },
        {
            key: 'worlds',
            feature: 'world',
            path: '/worlds',
            title: 'search.tab_worlds',
            icon: 'material-symbols:public',
            layout: 'card',
            fetchResults: async (query, limit, offset) => {
                const data = await searchWorlds(query, limit, offset);
                return {
                    total: data.total,
                    limit: data.limit,
                    offset: data.offset,
                    items: data.items.map((w) => {
                        let id = getAlias(w.alias, 'nid') ?? getAlias(w.alias, 'iid') ?? `${w.id}@${w.server}`;
                        return {
                            id: id,
                            name: w.title,
                            thumbnail: w.thumbnail,
                            description: id,
                            redirect: `/w/${noxIdToSegment(id, localAddress)}`,
                        }
                    }),
                };
            },
        },
        {
            key: 'avatars',
            feature: 'avatar',
            path: '/avatars',
            title: 'search.tab_avatars',
            icon: 'material-symbols:person-rounded',
            layout: 'card',
            fetchResults: async (query, limit, offset) => {
                const data = await searchAvatars(query, limit, offset);
                return {
                    total: data.total,
                    limit: data.limit,
                    offset: data.offset,
                    items: data.items.map((a) => {
                        let id = getAlias(a.alias, 'nid') ?? getAlias(a.alias, 'iid') ?? `${a.id}@${a.server}`;
                        return {
                            id: id,
                            name: a.title,
                            thumbnail: a.thumbnail,
                            description: id,
                            redirect: `/a/${noxIdToSegment(id, localAddress)}`,
                        }
                    }),
                };
            },
        },
        {
            key: 'instances',
            feature: 'instance',
            path: '/instances',
            title: 'search.tab_instances',
            icon: 'material-symbols:location-on-rounded',
            layout: 'card',
            fetchResults: async (query, limit, offset) => {
                const data = await searchInstances(query, limit, offset);
                return {
                    total: data.total,
                    limit: data.limit,
                    offset: data.offset,
                    items: data.items.map((i) => {
                        const id = getAlias(i.alias, 'nid') || getAlias(i.alias, 'iid') || `${i.id}@${i.server}`;
                        return {
                            id: id,
                            name: i.title,
                            thumbnail: i.thumbnail,
                            description: id,
                            redirect: `/i/${noxIdToSegment(id, localAddress)}`,
                        }
                    }),
                };
            }
        },
        {
            key: 'servers',
            feature: 'server',
            path: '/servers',
            title: 'search.tab_servers',
            icon: 'material-symbols:dns',
            layout: 'list',
            fetchResults: async (query, limit, offset) => {
                const data = await searchServers(query, limit, offset, locale);
                return {
                    total: data.total,
                    limit: data.limit,
                    offset: data.offset,
                    items: data.items.map((s) => {
                        const wm = s.wellknown?.metadata;
                        const title = resolveLocalized(wm?.title, locale) || null;
                        return {
                            id: s.address,
                            name: title || s.address,
                            thumbnail: resolveInstanceIcon(wm?.icon),
                            description: title ? s.address : null,
                            redirect: `/s/${s.address}`,
                        };
                    }),
                };
            },
        },
    ];
}

const LIMIT = 20;

// ── Page ─────────────────────────────────────────────────────────────────────

function SearchPageInner() {
    const { t, i18n } = useTranslation();
    const { wellKnown } = useApi();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Derive available tabs from server features (show all while wk is loading)
    const localAddress = wellKnown?.address ?? '::';
    const allTabs = buildTabs(localAddress, i18n.language);
    const availableTabs = wellKnown
        ? allTabs.filter((tab) => wellKnown.features.includes(tab.feature))
        : allTabs;

    // ── URL param state ──────────────────────────────────────────────────────

    const queryParam = searchParams.get('q') ?? '';
    const tabParam = (searchParams.get('type') as TabKey) ?? availableTabs[0]?.key ?? 'users';
    const pageParam = Math.max(1, Number(searchParams.get('p') ?? 1));

    const [query, setQuery] = useState(queryParam);
    const debouncedQuery = useSearch(query, 400);
    const [activeTab, setActiveTab] = useState<TabKey>(
        availableTabs.some((tab) => tab.key === tabParam) ? tabParam : (availableTabs[0]?.key ?? 'users'),
    );
    const [page, setPage] = useState(pageParam);

    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<SearchResults>({});

    // ── URL sync ─────────────────────────────────────────────────────────────

    const pushParams = useCallback(
        (q: string, tab: TabKey, p: number) => {
            const params = new URLSearchParams();
            if (q) params.set('q', q);
            params.set('type', tab);
            if (p > 1) params.set('p', String(p));
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        },
        [router, pathname],
    );

    // Reset page & push URL when debounced query changes
    useEffect(() => {
        setPage(1);
        pushParams(debouncedQuery, activeTab, 1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedQuery]);

    // ── Fetch ─────────────────────────────────────────────────────────────────

    useEffect(() => {
        if (!wellKnown || !debouncedQuery.trim()) {
            setResults((r) => ({
                ...r,
                [activeTab]: debouncedQuery.trim() ? new Error('Feature not available') : undefined,
            }));
            return;
        }

        const tabDef = allTabs.find((tab) => tab.key === activeTab);
        if (!tabDef) return;

        const offset = (page - 1) * LIMIT;
        let cancelled = false;
        setLoading(true);

        tabDef.fetchResults(debouncedQuery, LIMIT, offset)
            .then((data) => {
                if (!cancelled)
                    setResults((r) => ({
                        ...r,
                        [activeTab]: data,
                    }));
            })
            .catch(e => {
                if (!cancelled) {
                    console.error('Search error:', e);
                    setResults((r) => ({
                        ...r,
                        [activeTab]: e instanceof Error ? e : new Error('An unknown error occurred'),
                    }));
                }
            })
            .finally(() => {
                if (!cancelled)
                    setLoading(false);
            });

        return () => { cancelled = true; };
    }, [debouncedQuery, activeTab, page, wellKnown]);

    // ── Handlers ─────────────────────────────────────────────────────────────

    function handleTabChange(tab: string) {
        const key = tab as TabKey;
        setActiveTab(key);
        setPage(1);
        setResults({ // keep existing results but reset error state
            ...results,
            [key]: results[key]
        });
        pushParams(debouncedQuery, key, 1);
    }

    function handlePage(p: number) {
        setPage(p);
        pushParams(debouncedQuery, activeTab, p);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const noQuery = !debouncedQuery.trim();
    const title = t(noQuery ? 'search.title' : `search.results_for`, { query: debouncedQuery.trim() });

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="container mx-auto px-4 py-10">
            <PageTitle title={title} />
            <h1 className="font-heading text-3xl font-bold mb-6">{t('search.title')}</h1>

            <Tabs
                value={activeTab}
                className={"flex flex-col lg:flex-row items-stretch justify-between gap-3 mb-8"}
                onValueChange={handleTabChange}>
                {/* Search bar + tab selector inline */}
                <div className="flex flex-col gap-3 mb-8">
                    {/* Search input */}
                    <div className="relative min-w-0">
                        <Icon icon="material-symbols:search-rounded" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                            type="search"
                            placeholder={t('search.placeholder')}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="pl-9 pr-9"
                            autoFocus
                        />
                        {query && (
                            <button
                                onClick={() => setQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                aria-label={t('common.clear')}
                            >
                                <Icon icon="material-symbols:close-rounded" className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* Tab selector — right of search bar */}
                    <TabsList className="w-full flex flex-col items-stretch" aria-label={t('search.tabs')}>
                        {availableTabs.map((tab) => (
                            <TabsTrigger key={tab.key} value={tab.key} className="flex-1 w-full justify-between px-4 py-2">
                                <span>{t(tab.title!)}</span>
                                {tab.icon && <Icon icon={tab.icon} className="h-4 w-4 ml-2" />}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>


                {/* Results panels */}
                {availableTabs.map((tab) => (
                    <TabsContent key={tab.key} value={tab.key}>
                        <ResultTabContent
                            tab={tab}
                            data={results[tab.key]}
                            loading={loading}
                            noQuery={noQuery}
                            onPage={handlePage}
                        />
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense>
            <SearchPageInner />
        </Suspense>
    );
}

function ResultTabContent({
    tab,
    data,
    loading,
    noQuery,
    onPage,
}: {
    tab: TabDef;
    data: ApiSearchResult<ResultItem> | Error | undefined;
    loading: boolean;
    noQuery: boolean;
    onPage: (p: number) => void;
}) {
    const { t } = useTranslation();
    if (noQuery)
        return <EmptyState label={t('search.empty_no_query')} />;

    if (loading || !data) {
        if (tab.layout === 'card') return <SkeletonGrid />;
        else return <SkeletonList />;
    }

    if (data instanceof Error)
        return <EmptyState label={t('search.error')} details={data.message} />;

    if (data.items.length === 0)
        return <EmptyState label={t('search.empty_no_results')} />;

    return (
        <div>
            {tab.layout === 'card' ? (
                <ResultGrid>
                    {data.items.map((item) => <CardItem key={item.id} {...item} />)}
                </ResultGrid>
            ) : (
                <ResultList>
                    {data.items.map((item) => <ListItem key={item.id} {...item} />)}
                </ResultList>
            )}
            <PageNav page={data.offset / data.limit + 1} total={data.total} limit={data.limit} onPage={onPage} />
        </div>
    );
}


