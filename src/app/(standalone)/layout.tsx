'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { InstanceLogo } from '@/components/layout/InstanceLogo';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { useApi } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import { resolveLocalized } from '@/lib/i18n/resolveLocalized';
import { useTheme } from 'next-themes';
import Background from '@/components/shared/Background';

const PixelBlast = dynamic(() => import('@/components/ui/pixel-blast'), { ssr: false });

export default function StandaloneLayout({ children }: { children: React.ReactNode }) {
    const { wellKnown } = useApi();
    const { t, i18n } = useTranslation();
    const instanceName = resolveLocalized(wellKnown?.metadata?.title, i18n.language) || 'Nox';
    const { resolvedTheme } = useTheme();

    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10 overflow-hidden">
            {/* Background */}
            <div className="pointer-events-none absolute inset-0 z-0">
                <Background/>
            </div>

            {/* Content */}
            <div className="relative z-10 flex w-full max-w-md flex-col gap-6">
                <div className="flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 font-medium text-foreground bg-[var(--background)] px-2 py-1 rounded-lg">
                        <InstanceLogo />
                        <span className="font-heading text-xl font-bold">{instanceName}</span>
                    </Link>
                    <div className="flex items-center gap-1 bg-[var(--background)] px-2 py-1 rounded-lg">
                        <LanguageSwitcher />
                        <ThemeToggle />
                    </div>
                </div>

                {children}

                <p className="text-center text-xs text-muted-foreground/70 bg-[var(--background)] px-2 py-1 rounded-lg">
                    {t('auth.terms_text')}{' '}
                    <Link href="/terms" className="underline hover:text-foreground">{t('auth.terms_of_service')}</Link>
                    {' '}and{' '}
                    <Link href="/privacy" className="underline hover:text-foreground">{t('auth.privacy_policy')}</Link>.
                </p>
            </div>
        </div>
    );
}
