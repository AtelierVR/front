import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getT } from '@/lib/i18n/server';
import { buildSearchParams } from '@/lib/search-params';
import { SearchPageClient } from './SearchPageClient';

interface Props {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
    const t = await getT();
    const sp = buildSearchParams(await searchParams);
    const rawQ = sp.one('q');
    const title = rawQ ? t('search.results_for', { query: rawQ }) : t('search.title');
    return { title };
}

export default async function SearchPage({ searchParams }: Props) {
    const sp = buildSearchParams(await searchParams);
    const q = sp.one('q');

    return (
        <Suspense>
            <SearchPageClient initialQuery={q} />
        </Suspense>
    );
}


