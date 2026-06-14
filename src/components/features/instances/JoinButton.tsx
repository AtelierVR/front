'use client';

import Link from 'next/link';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useInstance } from './InstanceContext';
import type { ApiInstanceConnection } from '@/types/api';

interface JoinButtonProps {
  connection: ApiInstanceConnection | null;
  className?: string;
}

export function JoinButton({ connection, className }: JoinButtonProps) {
  const { t } = useTranslation();
  const { instance } = useInstance();

  const unlimited = instance ? instance.capacity === 0 : false;
  const isFull = !unlimited && instance ? instance.count >= instance.capacity : false;

  if (!connection) {
    return (
      <Button disabled className={className} aria-label={t('instance.closed', 'Closed')}>
        <Icon icon="material-symbols:block-rounded" className="size-4 me-2" />
        {t('instance.closed', 'Closed')}
      </Button>
    );
  }

  if (isFull) {
    return (
      <Button disabled className={className} aria-label={t('instance.full', 'Full')}>
        <Icon icon="material-symbols:group-off-rounded" className="size-4 me-2" />
        {t('instance.full', 'Full')}
      </Button>
    );
  }

  const deepLink = `${connection.method}:${connection.data}`;

  return (
    <Button render={<Link href={deepLink} />} className={className} aria-label={t('instance.join')}>
      <Icon icon="material-symbols:login-rounded" className="size-4 me-2" />
      {t('instance.join')}
    </Button>
  );
}
