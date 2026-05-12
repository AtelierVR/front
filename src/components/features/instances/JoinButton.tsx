'use client';

import Link from 'next/link';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import type { ApiInstanceConnection } from '@/types/api';

interface JoinButtonProps {
  connection: ApiInstanceConnection | null;
  className?: string;
}

export function JoinButton({ connection, className }: JoinButtonProps) {
  const { t } = useTranslation();

  if (!connection) {
    return (
    <Button variant="ghost" disabled className={className} aria-label={t('instance.join')}>
      <Icon icon="material-symbols:login-rounded" className="size-4 me-2" />
      {t('instance.join')}
    </Button>
  );
  }

  // Deep-link URI: method is the scheme, data is the rest of the URI
  const deepLink = `${connection.method}:${connection.data}`;

  return (
    <Button variant="ghost" render={<Link href={deepLink} />} className={className} aria-label={t('instance.join')}>
      <Icon icon="material-symbols:login-rounded" className="size-4 me-2" />
      {t('instance.join')}
    </Button>
  );
}
