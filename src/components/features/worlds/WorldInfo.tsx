'use client';

import { useTranslation } from 'react-i18next';
import { SidebarCard } from '@/components/shared/SidebarCard';
import { useWorld } from './WorldContext';
import { releaseVersion } from '@/types/api';

export function WorldInfo() {
  const { world, isOwner, isContributor } = useWorld();
  const { t } = useTranslation();

  return (
    <SidebarCard
      title={t('world.info')}
      editHref={world ? `/w/${world.id}/edit#capacity` : undefined}
      isSame={isOwner || isContributor}
    >
      <dl className="space-y-2 text-sm">
        <div className="flex items-center justify-between gap-2">
          <dt className="text-muted-foreground">{t('world.capacity')}</dt>
          {world ? (
            <dd className="font-medium tabular-nums">{world.capacity || t("world.unlimited")}</dd>
          ) : (
            <dd className="animate-pulse rounded-sm bg-muted h-3 w-10" />
          )}
        </div>

        {world?.server && (
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted-foreground">{t('world.server')}</dt>
            <dd className="font-mono text-xs truncate max-w-[160px]">{world.server}</dd>
          </div>
        )}

        {world && (
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted-foreground">{t('world.release')}</dt>
            <dd className="font-mono text-xs">{releaseVersion(world.release) >= 0 ? `v${releaseVersion(world.release)}` : '—'}</dd>
          </div>
        )}
      </dl>
    </SidebarCard>
  );
}
