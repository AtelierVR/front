'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { SidebarCard } from '@/components/shared/SidebarCard';
import { getUser } from '@/lib/api/users';
import { formatNoxId } from '@/types/nox-identifier';
import { useWorld } from './WorldContext';
import { useTranslation } from 'react-i18next';
import type { ApiUser } from '@/types/api';
import { useApi } from '@/lib/api/context';

function ContributorRow({ noxRef, isOwner }: { noxRef: string; isOwner: boolean }) {
  const [user, setUser] = useState<ApiUser | undefined | null>(undefined);
  const { wellKnown } = useApi();

  useEffect(() => {
    getUser(noxRef).then(setUser).catch(() => setUser(null));
  }, [noxRef]);

  const displayName = user ? (user.display || user.username) : null;
  const fallback = formatNoxId(noxRef, wellKnown?.address ?? '::');
  const href = `/u/${fallback}`;

  return (
    <Link href={href} className="flex items-center gap-3 text-sm group no-underline">
      <Avatar className="size-8 flex-shrink-0">
        {user?.thumbnail && <AvatarImage src={user.thumbnail} alt={displayName ?? fallback} />}
        <AvatarFallback className="bg-primary/10">
          {user === undefined ? null : displayName ? (
            displayName.charAt(0).toUpperCase()
          ) : (
            <Icon icon="material-symbols:person-rounded" className="size-4 text-muted-foreground" />
          )}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        {user === undefined ? (
          <>
            <Skeleton className="h-3.5 w-28 mb-1" />
            <Skeleton className="h-3 w-20" />
          </>
        ) : displayName ? (
          <>
            <div className="flex items-center gap-1 font-medium truncate">
              <span className="group-hover:underline">{displayName}</span>
              {isOwner && <Icon icon="material-symbols:star-rounded" className="size-3 text-muted-foreground flex-shrink-0" />}
            </div>
            <div className="text-xs text-muted-foreground truncate font-mono">{noxRef}</div>
          </>
        ) : (
          <div className="flex items-center gap-1 font-mono text-xs truncate">
            {isOwner && <Icon icon="material-symbols:star-rounded" className="size-3 text-muted-foreground flex-shrink-0" />}
            <span className="group-hover:underline">{noxRef}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

export function WorldContributors() {
  const { world, isOwner } = useWorld();
  const { t } = useTranslation();

  const all = world
    ? [
        { ref: world.owner, isOwner: true },
        ...world.contributors
          .filter((c) => c !== world.owner)
          .map((c) => ({ ref: c, isOwner: false })),
      ]
    : null;

  if (all !== null && all.length === 0) return null;

  return (
    <SidebarCard
      title={t('world.contributors')}
      editHref={world ? `/w/${world.id}/edit#contributors` : undefined}
      isSame={isOwner}
    >
      {!all ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="size-8 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {all.map(({ ref, isOwner }) => (
            <ContributorRow key={ref} noxRef={ref} isOwner={isOwner} />
          ))}
        </div>
      )}
    </SidebarCard>
  );
}
