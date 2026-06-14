import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import { getAlias, useApi } from '@/lib/api';
import { noxIdToSegment } from '@/types/nox-identifier';
import type { ApiInstance } from '@/types/api';

interface InstanceCardProps {
  instance: ApiInstance;
}

export function InstanceCard({ instance }: InstanceCardProps) {
  const { t } = useTranslation();

  const unlimited = instance.capacity === 0;
  const isFull = !unlimited && instance.count >= instance.capacity;
  const statusVariant = isFull ? 'destructive' : 'secondary';
  const statusLabel = isFull ? t('instance.full', 'Full') : t('instance.open', 'Open');

  const playerText = unlimited
    ? t('instance.players_count', { count: instance.count })
    : t('instance.players', { count: instance.count, capacity: instance.capacity });

  const { wellKnown } = useApi();
  const localAddress = wellKnown?.address ?? '::';
  const rawId = getAlias(instance.alias, 'nid')
    ?? getAlias(instance.alias, 'iid')
    ?? `${instance.id}@${instance.server}`;
  const href = `/i/${noxIdToSegment(rawId, localAddress)}`;

  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ variant: 'outline' }),
        'block overflow-hidden relative hover:ring-3 hover:ring-primary/50 transition-all duration-200 aspect-[4/3] h-auto p-0',
      )}
    >
      <Image
        src={instance.thumbnail ?? '/placeholder.png'}
        alt={instance.title ?? instance.name ?? 'Instance'}
        width={400}
        height={300}
        className="w-full object-cover h-full"
      />
      <div className="absolute inset-0 bg-gradient-to-t dark:from-black/80 from-white/20 to-transparent flex flex-col justify-end p-4">
        <p className="font-bold text-lg truncate">{instance.title ?? instance.name}</p>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Icon icon="material-symbols:group-rounded" className="h-4 w-4" />
            <span>{playerText}</span>
          </div>
          {!unlimited && (
            <Badge variant={statusVariant} className="text-xs">
              {statusLabel}
            </Badge>
          )}
        </div>
      </div>
    </Link>
  );
}
