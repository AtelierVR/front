'use client';

import Link from 'next/link';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ComponentType, ReactNode } from 'react';
import PublicLayout from '@/app/(public)/layout';

export interface NotFoundProps {
  layout?: ComponentType<{ children: ReactNode }>;
  className?: string;
  back?: {
    label: string;
    href: string;
  };
}

export function NotFound({ layout: Layout, ...props }: NotFoundProps = {}) {
  const { t } = useTranslation();

  const content = <main className={cn("flex flex-1 items-center justify-center p-4", props.className)}>
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
  </main>;

  if (Layout)
    return <Layout>{content}</Layout>;
  return content;
}

export default function NotFoundPage() {
  return <NotFound layout={PublicLayout} />;
}
