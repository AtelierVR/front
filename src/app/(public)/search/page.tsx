'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
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
    /** Feature flag that must be present in wk.features to show this tab. Also used as the tab identifier in URL (?type=). */
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

function buildTabs(localAddress: string): TabDef[] {
    return [
        {
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
            feature: 'server',
            path: '/servers',
            title: 'search.tab_servers',
            icon: 'material-symbols:dns',
            layout: 'list',
            fetchResults: async (query, limit, offset) => {
                const data = await searchServers(query, limit, offset);
                return {
                    total: data.total,
                    limit: data.limit,
                    offset: data.offset,
                    items: data.items.map((s) => {
                        const wm = s.wellknown?.metadata;
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
}

const LIMIT = 20;

// ── Page ─────────────────────────────────────────────────────────────────────

function SearchPageInner() {
    const { t } = useTranslation();
    const { wellKnown } = useApi();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // ── Derive state from URL (single source of truth) ───────────────────────

    const localAddress = wellKnown?.address ?? '::';
    const allTabs = buildTabs(localAddress);
    const availableTabs = wellKnown
        ? allTabs.filter((tab) => wellKnown.features.includes(tab.feature))
        : allTabs;

    const urlQuery = searchParams.get('q') ?? '';
    const urlTab = (searchParams.get('type') as TabKey) ?? availableTabs[0]?.feature ?? 'user';
    const urlPage = Math.max(1, Number(searchParams.get('p') ?? 1));

    // Only tab/page are derived from URL; query is local + debounced
    const activeTab = availableTabs.some(t => t.feature === urlTab) ? urlTab : (availableTabs[0]?.feature ?? 'user');
    const page = urlPage;

    const [query, setQuery] = useState(urlQuery);
    const debouncedQuery = useSearch(query, 400);

    // ── Fetch state ──────────────────────────────────────────────────────────

    const [results, setResults] = useState<SearchResults>({});
    const [loading, setLoading] = useState(false);
    const abortRef = useRef<AbortController | null>(null);
    const fetchIdRef = useRef(0);

    // ── Push URL (only on user action) ───────────────────────────────────────

    const pushUrl = useCallback((q: string, tab: string, p: number) => {
        const params = new URLSearchParams();
        if (q) params.set('q', q);
        params.set('type', tab);
        if (p > 1) params.set('p', String(p));
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, [router, pathname]);

    // Push debounced query to URL
    useEffect(() => {
        if (debouncedQuery === urlQuery) return;
        pushUrl(debouncedQuery, activeTab, 1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedQuery]);

    // ── Fetch ────────────────────────────────────────────────────────────────

    useEffect(() => {
        if (!wellKnown) return;

        const tabDef = allTabs.find(t => t.feature === activeTab);
        if (!tabDef) return;

        // Cancel previous in-flight request
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        const fetchId = ++fetchIdRef.current;

        const offset = (page - 1) * LIMIT;
        setLoading(true);

        tabDef.fetchResults(debouncedQuery, LIMIT, offset)
            .then((data) => {
                if (controller.signal.aborted || fetchId !== fetchIdRef.current) return;
                setResults(r => ({ ...r, [activeTab]: data }));
            })
            .catch(e => {
                if (controller.signal.aborted || fetchId !== fetchIdRef.current) return;
                setResults(r => ({
                    ...r,
                    [activeTab]: e instanceof Error ? e : new Error('Unknown error'),
                }));
            })
            .finally(() => {
                if (fetchId === fetchIdRef.current) setLoading(false);
            });

        return () => controller.abort();
    }, [debouncedQuery, activeTab, page, wellKnown]);

    // ── Handlers ─────────────────────────────────────────────────────────────

    function handleTabChange(tab: string) {
        pushUrl(debouncedQuery, tab, 1);
    }

    function handlePage(p: number) {
        pushUrl(debouncedQuery, activeTab, p);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const noQuery = !debouncedQuery.trim();
    const title = noQuery ? t('search.title') : t('search.results_for', { query: debouncedQuery.trim() });

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="container mx-auto px-4 py-10">
            <PageTitle title={title} />
            <h1 className="font-heading text-3xl font-bold mb-6">{t('search.title')}</h1>

            <div className="flex flex-col lg:flex-row lg:items-start gap-6 mb-8">
                {/* Search bar + tab selector — left sidebar on desktop */}
                <div className="flex flex-col gap-3 lg:w-56 lg:shrink-0">
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

                    {/* Tab selector — vertical on desktop */}
                    <Tabs
                        value={activeTab}
                        onValueChange={handleTabChange}
                        className="flex flex-col">
                        <TabsList className="w-full flex flex-col items-stretch" aria-label={t('search.tabs')}>
                            {availableTabs.map((tab) => (
                                <TabsTrigger key={tab.feature} value={tab.feature} className="flex-1 w-full justify-between px-4 py-2">
                                    <span>{t(tab.title!)}</span>
                                    {tab.icon && <Icon icon={tab.icon} className="h-4 w-4 ml-2" />}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                </div>

                {/* Results panels — right side on desktop */}
                <div className="flex-1 min-w-0">
                    {availableTabs.map((tab) => (
                        <div key={tab.feature} className={tab.feature === activeTab ? '' : 'hidden'}>
                            <ResultTabContent
                                tab={tab}
                                data={results[tab.feature]}
                                loading={loading}
                                onPage={handlePage}
                            />
                        </div>
                    ))}
                </div>
            </div>
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
    onPage,
}: {
    tab: TabDef;
    data: ApiSearchResult<ResultItem> | Error | undefined;
    loading: boolean;
    onPage: (p: number) => void;
}) {
    const { t } = useTranslation();

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


