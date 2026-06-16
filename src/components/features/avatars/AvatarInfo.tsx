'use client';

import { useTranslation } from 'react-i18next';
import { SidebarCard } from '@/components/shared/SidebarCard';
import { useAvatar } from './AvatarContext';
import { releaseVersion } from '@/types/api';

export function AvatarInfo() {
  const { avatar, isOwner, isContributor } = useAvatar();
  const { t } = useTranslation();

  return (
    <SidebarCard
      title={t('avatar.info')}
      editHref={avatar ? `/a/${avatar.id}/edit#release` : undefined}
      isSame={isOwner || isContributor}
    >
      <dl className="space-y-2 text-sm">
        {avatar?.server && (
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted-foreground">{t('avatar.server')}</dt>
            <dd className="font-mono text-xs truncate max-w-[160px]">{avatar.server}</dd>
          </div>
        )}

        {avatar && (
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted-foreground">{t('avatar.release')}</dt>
            <dd className="font-mono text-xs">{releaseVersion(avatar.release) >= 0 ? `v${releaseVersion(avatar.release)}` : '—'}</dd>
          </div>
        )}

        {!avatar && (
          <>
            <div className="flex items-center justify-between gap-2">
              <div className="animate-pulse rounded-sm bg-muted h-3 w-14" />
              <div className="animate-pulse rounded-sm bg-muted h-3 w-24" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="animate-pulse rounded-sm bg-muted h-3 w-10" />
              <div className="animate-pulse rounded-sm bg-muted h-3 w-10" />
            </div>
          </>
        )}
      </dl>
    </SidebarCard>
  );
}
