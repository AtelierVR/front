'use client';

import { useTranslation } from 'react-i18next';
import { DocsBody, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page';
import { PageTitle } from '@/components/shared/PageTitle';
import { UserFollowList } from '@/components/features/users/UserFollowList';

export default function FollowersPage() {
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
