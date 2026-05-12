'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useApi } from '@/lib/api/context';
import { Button } from '@/components/ui/button';

export function CallToActionBlock() {
  const { t } = useTranslation();
  const { currentUser } = useApi();

  if (currentUser) return null;

  return (
    <section className="py-24 text-center bg-primary/5">
      <div className="container mx-auto px-4 max-w-2xl">
        <h2 className="font-heading text-3xl font-bold mb-4">
          {t('home.cta_title')}
        </h2>
        <p className="text-muted-foreground text-lg mb-8">
          {t('home.cta_desc')}
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Button size="lg" render={<Link href="/register" />}>
            {t('home.cta_button')}
          </Button>
          <Button size="lg" variant="ghost" render={<Link href="/search" />}>
            {t('home.hero_cta_explore')}
          </Button>
        </div>
      </div>
    </section>
  );
}
