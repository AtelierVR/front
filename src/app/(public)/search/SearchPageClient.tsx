'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { useSearch } from '@/hooks/useSearch';
import { useApi } from '@/lib/api/context';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { PageTitle } from '@/components/shared/PageTitle';
import type { ApiSearchResult } from '@/types/api';
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
import { DEFAULT_TAB, SEARCH_TABS, type TabDef } from '@/lib/search-tabs';

const LIMIT = 20;

interface SearchResults {
    [key: string]: ApiSearchResult<ResultItem> | Error | undefined;
}

interface SearchPageClientProps {
    initialQuery?: string;
}

export function SearchPageClient({ initialQuery = '' }: SearchPageClientProps) {
    const { t } = useTranslation();
    const { wellKnown } = useApi();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // ── Derive state from URL (single source of truth) ───────────────────────

    const localAddress = wellKnown?.address ?? '::';
    const availableTabs = wellKnown
        ? SEARCH_TABS.filter((tab) => wellKnown.features.includes(tab.feature))
        : SEARCH_TABS;

    const urlQuery = searchParams.get('q') ?? initialQuery;
    const urlTab = searchParams.get('type') ?? availableTabs[0]?.feature ?? DEFAULT_TAB;
    const urlPage = Math.max(1, Number(searchParams.get('p') ?? 1));

    const activeTab = availableTabs.some(t => t.feature === urlTab) ? urlTab : (availableTabs[0]?.feature ?? DEFAULT_TAB);
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

        const tabDef = SEARCH_TABS.find(t => t.feature === activeTab);
        if (!tabDef) return;

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        const fetchId = ++fetchIdRef.current;

        const offset = (page - 1) * LIMIT;
        setLoading(true);

        tabDef.fetchResults(localAddress, debouncedQuery, LIMIT, offset)
            .then((data) => {
                if (controller.signal.aborted || fetchId !== fetchIdRef.current) return;
                setResults(r => ({ ...r, [activeTab]: data }));
            })
            .catch(e => {
                if (controller.signal.aborted || fetchId !== fetchIdRef.current) return;
                setResults(r => ({ ...r, [activeTab]: e instanceof Error ? e : new Error('Unknown error') }));
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

    // ── Title ────────────────────────────────────────────────────────────────

    const noQuery = !debouncedQuery.trim();
    const title = noQuery ? t('search.title') : t('search.results_for', { query: debouncedQuery.trim() });

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="container mx-auto px-4 py-10">
            <PageTitle title={title} />
            <h1 className="font-heading text-3xl font-bold mb-6">{t('search.title')}</h1>

            <div className="flex flex-col lg:flex-row lg:items-start gap-6 mb-8">
                <div className="flex flex-col gap-3 lg:w-56 lg:shrink-0">
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

                    <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col">
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
        return tab.layout === 'card' ? <SkeletonGrid /> : <SkeletonList />;
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
