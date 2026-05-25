'use client';

import { LegalPage } from '@/components/shared/LegalPage';
import { useTranslation } from 'react-i18next';

export default function PrivacyPageClient() {
    const { t } = useTranslation();
    return (
        <LegalPage
            endpoint="privacy"
            title={t('footer.privacy_policy')}
            description={t('nav.legal_privacy_desc')}
        />
    );
}
