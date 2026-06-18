'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { SidebarCard } from '@/components/shared/SidebarCard';
import { UserReference } from '@/components/ui/user-reference';
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

  if (user === undefined) {
    return (
      <span className="flex items-center gap-3">
        <Skeleton className="size-8 rounded-full shrink-0" />
        <div className="flex-1 space-y-1">
          <Skeleton className="h-3.5 w-28 rounded" />
          <Skeleton className="h-3 w-20 rounded" />
        </div>
      </span>
    );
  }

  if (!user) {
    const localAddress = wellKnown?.address ?? '::';
    const fallbackId = formatNoxId(noxRef, localAddress);
    return (
      <Link href={`/u/${fallbackId}`} className="flex items-center gap-3 text-sm group no-underline">
        <Avatar className="size-8 shrink-0">
          <AvatarFallback className="bg-primary/10">
            <Icon icon="material-symbols:person-rounded" className="size-4 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 font-mono text-xs truncate">
            {isOwner && (
              <Icon icon="material-symbols:star-rounded" className="size-3 text-muted-foreground shrink-0" />
            )}
            <span className="group-hover:underline">{fallbackId}</span>
          </div>
        </div>
      </Link>
    );
  }

  return <UserReference user={user} isOwner={isOwner} />;
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
