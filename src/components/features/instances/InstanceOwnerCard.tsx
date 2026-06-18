'use client';

import { useTranslation } from 'react-i18next';
import { useInstance } from './InstanceContext';
import { SidebarCard } from '@/components/shared/SidebarCard';
import { UserReference } from '@/components/ui/user-reference';

export function InstanceOwnerCard() {
    const { instance, owner } = useInstance();
    const { t } = useTranslation();

    if (!instance || !owner)
        return null;

    return (
        <SidebarCard title={t('instance.owner')}>
            <UserReference user={owner} />
        </SidebarCard>
    );
}
