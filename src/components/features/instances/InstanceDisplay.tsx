'use client';

import Link from 'next/link';
import { Icon } from '@iconify/react';
import { Badge } from '@/components/ui/badge';
import { PLATFORMS } from '@/lib/platform';
import { noxIdToPath } from '@/types/nox-identifier';
import { useInstance } from './InstanceContext';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export function InstanceDisplay(props: { className?: string }) {
  const { instance, world, worldAssets } = useInstance();
  const { t } = useTranslation();

  const isFull = instance ? instance.capacity > 0 && instance.count >= instance.capacity : false;

  // Platforms from world release assets
  const releaseAssets = world && worldAssets
    ? worldAssets.filter((a) => a.version === world.release)
    : null;
  const platforms = releaseAssets
    ? [...new Set(releaseAssets.map((a) => a.platform.toLowerCase()))]
    : null;

  const worldHref = instance ? noxIdToPath(instance.world, '/w') : null;

  return (
    <div className={cn('px-6 flex flex-col gap-1', props.className)}>
      <h1 className="text-2xl font-bold font-heading">
        {instance?.title
          ? <span>{instance.title}</span>
          : <div className="animate-pulse rounded-md bg-muted h-8 w-48" />}
      </h1>

      {instance ? (
        <div className="flex items-center flex-wrap divide-x divide-border text-muted-foreground font-medium gap-y-1">
          {/* World link */}
          {worldHref && (
            <Link
              href={worldHref}
              className="hover:underline pe-2 text-foreground underline-offset-2"
            >
              {world?.title ?? instance.world}
            </Link>
          )}

          {/* Platform icons from world assets */}
          {platforms && platforms.length > 0 && (
            <span className="flex items-center gap-1 px-2">
              {platforms.map((p) => {
                const info = PLATFORMS[p];
                if (!info) return <span key={p} className="text-xs font-mono">{p}</span>;
                return (
                  <span key={p} title={t(info.label)}>
                    <Icon icon={info.icon} className="size-4" style={{ color: info.color }} />
                  </span>
                );
              })}
            </span>
          )}

          {/* Player count */}
          <span className="flex items-center gap-1 px-2 text-sm">
            <Icon icon="material-symbols:group-rounded" className="size-3.5" />
            {instance.capacity === 0
              ? <>{t('instance.players_count', { count: instance.count })} · {t('world.unlimited')}</>
              : t('instance.players', { count: instance.count, capacity: instance.capacity })
            }
            {isFull && (
              <Badge variant="destructive" className="text-xs ms-1">
                {t('instance.full')}
              </Badge>
            )}
          </span>
        </div>
      ) : (
        <div className="animate-pulse rounded-md bg-muted h-4 w-2/3" />
      )}
    </div>
  );
}
