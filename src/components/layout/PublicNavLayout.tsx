'use client';

import { baseOptions } from '@/lib/layout.shared';
import { type ReactNode } from 'react';
import { useApi } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n/config';
import { Icon } from '@iconify/react';
import { Footer } from '@/components/layout/Footer';
import { useTheme } from '@/components/layout/ThemeProvider';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/hooks/useLanguage';

const featureIcons: Record<string, string> = {
    user: 'material-symbols:person-rounded',
    world: 'material-symbols:public',
    avatar: 'material-symbols:accessibility-new-rounded',
    instance: 'material-symbols:location-on-rounded',
    server: 'material-symbols:dns',
};

export function PublicNavLayout({ children }: { children: ReactNode }) {
    const API = useApi();
    const { t } = useTranslation();
    const { theme, setTheme } = useTheme();
    const languages = useLanguage();

    const themes = [
        { value: 'light', label: t('theme.light'), icon: 'material-symbols:light-mode-rounded' },
        { value: 'dark', label: t('theme.dark'), icon: 'material-symbols:dark-mode-rounded' },
        { value: 'system', label: t('theme.system'), icon: 'material-symbols:brightness-auto-rounded' },
    ] as const;

    return <div className="min-h-dvh flex flex-col">
        <div className="flex-1">
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
                    items: languages.map(({ code, name, flag: flagUrl }) => ({
                        type: 'button' as const,
                        icon: flagUrl ? (
                            <img
                                src={flagUrl}
                                alt={code}
                                className="h-4 w-4 rounded-sm object-cover"
                            />
                        ) : undefined,
                        text: name,
                        active: i18n.language === code,
                        onClick: () => i18n.changeLanguage(code),
                    })),
                },
                {
                    type: 'menu' as const,
                    on: 'nav' as const,
                    secondary: true,
                    text: <Icon
                        icon={themes.find(th => th.value === (theme ?? 'system'))?.icon ?? 'material-symbols:brightness-auto-rounded'}
                        className="h-4 w-4"
                    />,
                    items: themes.map(({ value, label, icon }) => ({
                        type: 'button' as const,
                        icon: <Icon icon={icon} />,
                        text: label,
                        active: theme === value,
                        onClick: () => setTheme(value),
                    })),
                },
                {
                    type: 'menu' as const,
                    on: 'nav' as const,
                    text: t('legal.label'),
                    items: [
                        {
                            type: 'main' as const,
                            icon: <Icon icon="material-symbols:lock" className="h-4 w-4" />,
                            text: t('legal.privacy.label'),
                            description: t('legal.privacy.description'),
                            url: '/privacy',
                        },
                        {
                            type: 'main' as const,
                            icon: <Icon icon="material-symbols:article-rounded" className="h-4 w-4" />,
                            text: t('legal.terms.label'),
                            description: t('legal.terms.description'),
                            url: '/terms',
                        },
                        {
                            type: 'main' as const,
                            icon: <Icon icon="material-symbols:gavel-rounded" className="h-4 w-4" />,
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
        </div>
        <Footer />
    </div>;
}
