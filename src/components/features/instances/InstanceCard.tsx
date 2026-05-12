import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@iconify/react';
import type { ApiInstance } from '@/types/api';

interface InstanceCardProps {
  instance: ApiInstance;
}

export function InstanceCard({ instance }: InstanceCardProps) {
  const { t } = useTranslation();

  const isFull = instance.count >= instance.capacity;
  const statusVariant = isFull ? 'destructive' : 'secondary';
  const statusLabel = isFull ? t('instance.full', 'Full') : t('instance.open', 'Open');

  const href = `/i/${instance.server ? `${instance.id}@${instance.server}` : instance.id}`;

  return (
    <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
      <Card className="overflow-hidden hover:border-primary/50 transition-colors">
        {instance.thumbnail ? (
          <div className="aspect-video w-full overflow-hidden bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={instance.thumbnail}
              alt={instance.title ?? instance.name}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="aspect-video w-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground text-xs">{t('common.unknown')}</span>
          </div>
        )}
        <CardContent className="py-3 px-4">
          <p className="font-semibold text-sm truncate">{instance.title ?? instance.name}</p>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Icon icon="material-symbols:group-rounded" className="h-3 w-3" />
              <span>{instance.count} / {instance.capacity}</span>
            </div>
            <Badge variant={statusVariant} className="text-xs">
              {statusLabel}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
