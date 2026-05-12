'use client';

import Link from 'next/link';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { cn } from '@/lib/utils';


export default function NotFoundPage() {
  return NotFound();
}

export interface NotFoundProps {
  clear?: boolean;
  className?: string;
  back?: {
    label: string;
    href: string;
  };
}

export function NotFound(props: NotFoundProps = {}) {
  const { t } = useTranslation();

  return <div className={cn(
    "flex flex-col",
    !props.clear && "min-h-screen",
    props.className
  )}>
    {!props.clear && <Header />}
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <div className="rounded-full bg-muted p-6">
          <Icon icon="material-symbols:help-rounded" className="size-12 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{t('not_found.title')}</h1>
          <p className="text-muted-foreground">{t('not_found.description')}</p>
        </div>
        <Button>
          <Link href={props.back?.href || "/"}>{props.back?.label || t('not_found.go_home')}</Link>
        </Button>
      </div>
    </main>
    {!props.clear && <Footer />}
  </div>;
}
