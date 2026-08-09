'use client';

import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { DocsBody, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page';
import { PageTitle } from '@/components/shared/PageTitle';
import { UserFollowList } from '@/components/features/users/UserFollowList';

export default function FollowersPage() {
    const { t } = useTranslation();
    return (
        <Suspense fallback={<div className="p-4 md:p-6 animate-pulse"><div className="h-8 w-48 bg-muted rounded mb-4" /><div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => (<div key={i} className="h-16 bg-muted rounded" />))}</div></div>}>
            <FollowersInner />
        </Suspense>
    );
}

function FollowersInner() {
    const { t } = useTranslation();
    return (
        <DocsPage>
            <PageTitle title={t('user.followers')} />
            <DocsTitle>{t('user.followers')}</DocsTitle>
            <DocsBody>
                <UserFollowList mode="followers" />
            </DocsBody>
        </DocsPage>
    );
}
