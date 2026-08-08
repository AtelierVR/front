'use client';

import { baseOptions } from '@/lib/layout.shared';
import { type ReactNode } from 'react';
import { useApi } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import { RESOURCES } from '@/lib/i18n/constants';
import i18n from '@/lib/i18n/config';
import { Icon } from '@iconify/react';
import { Footer } from '@/components/layout/Footer';
import { MainLayout } from '@/components/layout/MainLayout';

export default function LegalLayout({ children }: { children: ReactNode }) {
    const API = useApi();
    const { t } = useTranslation();

    const featureIcons: Record<string, string> = {
        user: 'material-symbols:person-rounded',
        world: 'material-symbols:public',
        avatar: 'material-symbols:accessibility-new-rounded',
        instance: 'material-symbols:location-on-rounded',
        server: 'material-symbols:dns',
    };

    return <>
        <MainLayout
            {...baseOptions()}
            links={[
                ...((API.wellKnown?.features ?? []).length > 0 ? [
                    {
                        type: 'menu' as const,
                        on: 'nav' as const,
                        text: t('features.label'),
                        items: (API.wellKnown?.features ?? []).map(feature => ({
                            type: 'main' as const,
                            icon: featureIcons[feature] ? <Icon icon={featureIcons[feature]} className="h-4 w-4" /> : undefined,
                            description: t(`features.${feature}.description`),
                            text: t(`features.${feature}.label`),
                            url: `/search?type=${feature}`,
                        })),
                    }
                ] : []),
                {
                    type: 'menu' as const,
                    on: 'nav' as const,
                    secondary: true,
                    text: <Icon icon="material-symbols:language" className="h-4 w-4" />,
                    items: Object.entries(RESOURCES).map(([code, locale]) => ({
                        type: 'button' as const,
                        text: locale.translation.language as string,
                        active: i18n.language === code,
                        onClick: () => i18n.changeLanguage(code),
                    })),
                },
                {
                    type: 'menu',
                    on: 'nav',
                    text: t('legal.label'),
                    items: [
                        {
                            type: 'main',
                            text: t('legal.privacy.label'),
                            description: t('legal.privacy.description'),
                            url: '/privacy',
                        },
                        {
                            type: 'main',
                            text: t('legal.terms.label'),
                            description: t('legal.terms.description'),
                            url: '/terms',
                        },
                        {
                            type: 'main',
                            text: t('legal.rules.label'),
                            description: t('legal.rules.description'),
                            url: '/rules',
                        },
                    ],
                },
            ]}
        >
            {children}
        </MainLayout>
        <Footer />
    </>;
}
