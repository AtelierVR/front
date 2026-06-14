'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Identifier } from '@/components/shared/Identifier';
import { getAlias, useApi } from '@/lib/api';
import { getUser } from '@/lib/api/users';
import { PLATFORMS, formatSize } from '@/lib/platform';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatNoxId } from '@/types/nox-identifier';
import { useAvatar } from './AvatarContext';
import type { ApiUser } from '@/types/api';
import { cn } from '@/lib/utils';

export function AvatarDisplay(props: { className?: string }) {
  const { avatar, allAssets, isOwner } = useAvatar();
  const { wellKnown } = useApi();
  const { t } = useTranslation();
  const [owner, setOwner] = useState<ApiUser | null>(null);

  useEffect(() => {
    if (!avatar) return;
    getUser(avatar.owner).then(setOwner).catch(() => {});
  }, [avatar?.owner]);

  const releaseAssets = avatar && allAssets
    ? allAssets.filter((a) => a.version === avatar.release)
    : null;

  const platforms = releaseAssets
    ? [...new Set(releaseAssets.map((a) => a.platform.toLowerCase()))]
    : null;

  const maxSize = releaseAssets
    ? releaseAssets.reduce<number | null>((max, a) => {
        if (a.size === null) return max;
        return max === null ? a.size : Math.max(max, a.size);
      }, null)
    : null;

  const ownerLabel = owner
    ? (owner.display || owner.username)
    : avatar
      ? formatNoxId(avatar.owner, wellKnown?.address ?? '::')
      : null;

  return (
    <div className={cn('flex flex-col gap-1', props.className)}>
      <h1 className="group text-2xl font-bold font-heading flex items-center gap-2">
        {avatar?.title
          ? <span>{avatar.title}</span>
          : <div className="animate-pulse rounded-md bg-muted h-8 w-48" />}
        {isOwner && avatar && (
          <Link href={`/a/${avatar.id}/edit#title`}>
            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity size-7">
              <Icon icon="material-symbols:edit-rounded" className="size-4" />
            </Button>
          </Link>
        )}
      </h1>

      {avatar ? (
        <div className="flex items-center flex-wrap divide-x divide-border text-muted-foreground font-medium gap-y-1">
          <Link
            href={`/u/${formatNoxId(avatar.owner, wellKnown?.address ?? '::')}`}
            className="hover:underline pe-2 text-foreground underline-offset-2"
          >
            {ownerLabel ?? formatNoxId(avatar.owner, wellKnown?.address ?? '::')}
          </Link>

          {platforms && platforms.length > 0 && (
            <span className="flex items-center gap-1 px-2">
              {platforms.map((p) => {
                const info = PLATFORMS[p];
                if (!info) return <span key={p} className="text-xs font-mono">{p}</span>;
                return (
                  <Tooltip key={p}>
                    <TooltipTrigger className="inline-flex">
                      <Icon icon={info.icon} className="size-4" style={{ color: info.color }} />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t(info.label)}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </span>
          )}

          {maxSize !== null && (
            <span className="px-2 text-sm">{formatSize(maxSize)}</span>
          )}

          {getAlias(avatar.alias, 'nid') && (
            <span className="pl-2">
              <Identifier value={getAlias(avatar.alias, 'nid')!} />
            </span>
          )}
        </div>
      ) : (
        <div className="animate-pulse rounded-md bg-muted h-4 w-2/3" />
      )}
    </div>
  );
}
