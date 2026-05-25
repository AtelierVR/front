'use client';

import { LegalPage } from '@/components/shared/LegalPage';
import { useTranslation } from 'react-i18next';

export default function TermsPageClient() {
    const { t } = useTranslation();
    return (
        <LegalPage
            endpoint="terms"
            title={t('footer.terms_of_service')}
            description={t('nav.legal_terms_desc')}
        />
    );
}
