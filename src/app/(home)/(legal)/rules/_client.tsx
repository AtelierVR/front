'use client';

import { LegalPage } from '@/components/shared/LegalPage';
import { useTranslation } from 'react-i18next';

export default function RulesPageClient() {
    const { t } = useTranslation();
    return (
        <LegalPage
            endpoint="rules"
            title={t('footer.rules')}
            description={t('nav.legal_rules_desc')}
        />
    );
}
