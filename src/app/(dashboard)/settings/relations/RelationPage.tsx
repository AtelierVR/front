'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { PageTitle } from '@/components/shared/PageTitle';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RelationList, type RelationTabKey } from './RelationList';

/**
 * Shared layout for the four relation pages: title bar (back button + search box)
 * and the matching relation list.
 */
export function RelationPage({ tab }: { tab: RelationTabKey }) {
    const { t } = useTranslation();
    const [query, setQuery] = useState('');

    return (
        <>
            <PageTitle title={t(`relations.tab_${tab}`)} />
            <SiteHeader
                before={
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t('relations.back')}
                        render={<Link href="/settings/relations" />}
                    >
                        <Icon icon="material-symbols:arrow-back-rounded" className="size-4" />
                    </Button>
                }
                subtitle={t(`relations.desc_${tab}`)}
                after={
                    <div className="relative">
                        <Icon
                            icon="material-symbols:search-rounded"
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
                        />
                        <Input
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder={t('relations.search_placeholder')}
                            className="pl-8 h-8 w-44 text-sm"
                        />
                    </div>
                }
            >
                {t(`relations.tab_${tab}`)}
            </SiteHeader>

            <div className="p-4 md:p-6">
                <RelationList tab={tab} query={query} />
            </div>
        </>
    );
}
