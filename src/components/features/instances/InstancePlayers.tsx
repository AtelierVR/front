'use client';

import Link from 'next/link';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { SidebarCard } from '@/components/shared/SidebarCard';
import { useInstance } from './InstanceContext';
import { useTranslation } from 'react-i18next';
import { useApi } from '@/lib/api/context';
import { formatNoxId } from '@/types/nox-identifier';

export function InstancePlayers() {
  const { instance } = useInstance();
  const { wellKnown } = useApi();
  const { t } = useTranslation();

  if (instance && instance.players.length === 0) return null;

  return (
    <SidebarCard title={t('instance.players_list')}>
      {!instance ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="size-8 rounded-full flex-shrink-0" />
              <Skeleton className="h-3.5 w-28" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {instance.players.map((player, idx) => {
            const href = player.user ? `/u/${formatNoxId(player.user, wellKnown?.address ?? '::')}` : null;
            const initial = player.display.charAt(0).toUpperCase();

            const inner = (
              <div className="flex items-center gap-3 text-sm group">
                <Avatar className="size-8 flex-shrink-0">
                  <AvatarFallback className="bg-primary/10 text-xs">{initial}</AvatarFallback>
                </Avatar>
                <span className="truncate font-medium group-hover:underline underline-offset-2">
                  {player.display}
                </span>
              </div>
            );

            return href ? (
              <Link key={idx} href={href} className="no-underline">
                {inner}
              </Link>
            ) : (
              <div key={idx}>{inner}</div>
            );
          })}
        </div>
      )}
    </SidebarCard>
  );
}
