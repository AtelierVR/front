'use client';

import Link from 'next/link';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export function NotFoundContent() {
  const { t } = useTranslation();

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <div className="rounded-full bg-muted p-6">
          <Icon icon="material-symbols:help-rounded" className="size-12 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{t('not_found.title')}</h1>
          <p className="text-muted-foreground">{t('not_found.description')}</p>
        </div>
        <Button render={<Link href="/" />}>
          {t('not_found.go_home')}
        </Button>
      </div>
    </main>
  );
}
