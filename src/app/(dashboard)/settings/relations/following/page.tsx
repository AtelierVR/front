'use client';

import { useTranslation } from 'react-i18next';
import { DocsBody, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page';
import { UserFollowList } from '@/components/features/users/UserFollowList';

export default function FollowingPage() {
    const { t } = useTranslation();
    return (
        <DocsPage>
            <DocsTitle>{t('user.following')}</DocsTitle>
            <DocsBody>
                <UserFollowList mode="following" />
            </DocsBody>
        </DocsPage>
    );
}
