'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useTranslation } from 'react-i18next';
import { resolveLocalized } from '@/lib/i18n/resolveLocalized';
import { useApi } from '@/lib/api/context';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import Background from '../shared/Background';

const PixelBlast = dynamic(() => import('@/components/ui/pixel-blast'), { ssr: false });

export function HeroBlock() {
  const { t, i18n } = useTranslation();
  const { wellKnown, currentUser } = useApi();
  const { resolvedTheme } = useTheme();

  const title = resolveLocalized(wellKnown?.metadata.title, i18n.language) || 'Nox';
  const description = resolveLocalized(wellKnown?.metadata.description, i18n.language) || t('home.hero_default_desc');

  return (
    <section className="relative py-24 text-center overflow-hidden">
      <div className="pointer-events-none absolute inset-0 z-0 opacity-40">
        <Background />
      </div>
      <div className="relative z-10 container mx-auto px-4 flex flex-col items-center">
        <h1 className="font-heading text-5xl font-bold tracking-tight md:text-7xl lg:text-8xl text-foreground">
          {t('home.hero_title', { instance: title })}
        </h1>
        {description && (
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl leading-relaxed bg-background px-4 py-1 rounded">
            {description}
          </p>
        )}
        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          {!currentUser ? (
            <>
              <Button size="lg" render={<Link href="/register" />}>
                {t('home.hero_cta_join', { instance: title })}
              </Button>
              <Button size="lg" variant="outline" render={<Link href="/login" />}>
                {t('home.hero_cta_login')}
              </Button>
            </>
          ) : (
            <Button size="lg" render={<Link href="/search" />}>
              {t('home.hero_cta_explore')}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
