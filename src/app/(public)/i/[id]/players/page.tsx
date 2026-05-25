'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ResultList } from '@/components/shared/ResultGrid';
import { useInstance } from '@/components/features/instances/InstanceContext';
import { useApi } from '@/lib/api/context';
import { useTranslation } from 'react-i18next';
import { formatNoxId, noxIdToSegment } from '@/types/nox-identifier';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { getUser } from '@/lib/api/users';
import type { ApiUser } from '@/types/api';

export default function InstancePlayersPage() {
    const { instance } = useInstance();
    const { wellKnown } = useApi();
    const { t } = useTranslation();
    const [userMap, setUserMap] = useState<Record<string, ApiUser>>({});
    const localAddress = wellKnown?.address ?? '::';

    useEffect(() => {
        if (!instance || !wellKnown) return;
        const players = instance.players.filter(p => p.user !== null);
        if (players.length === 0) return;

        let cancelled = false;
        Promise.allSettled(
            players.map(p =>
                getUser(noxIdToSegment(p.user!, localAddress))
                    .then(u => ({ key: p.user!, user: u }))
            )
        ).then(results => {
            if (cancelled) return;
            const map: Record<string, ApiUser> = {};
            for (const r of results) {
                if (r.status === 'fulfilled') {
                    map[r.value.key] = r.value.user;
                }
            }
            setUserMap(map);
        });

        return () => { cancelled = true; };
    }, [instance, wellKnown]);

    if (!instance) {
        return (
            <div className="flex flex-col gap-2">
                {[0, 1, 2].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
            </div>
        );
    }

    if (instance.players.length === 0) {
        return (
            <div className="text-center text-muted-foreground border border-dashed rounded-xl py-12">
                {t('instance.empty')}
            </div>
        );
    }

    const rowClass = cn(
        buttonVariants({ variant: 'outline', size: 'default' }),
        'w-full justify-start h-auto py-3 px-6 flex items-center gap-4',
    );

    return (
        <ResultList>
            {instance.players.map((player, idx) => {
                const href = player.user
                    ? `/u/${formatNoxId(player.user, localAddress)}`
                    : null;
                const fetchedUser = player.user ? userMap[player.user] : undefined;
                const initial = player.display.charAt(0).toUpperCase();
                const fullId = fetchedUser
                    ? `${fetchedUser.username}@${fetchedUser.server}`
                    : player.user ?? undefined;

                const inner = (
                    <>
                        <Avatar className="h-12 w-12 shrink-0">
                            <AvatarImage src={fetchedUser?.thumbnail ?? undefined} alt={player.display} className="object-cover" />
                            <AvatarFallback>{initial}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-bold text-lg">{player.display}</p>
                            {fullId && (
                                <p className="text-sm text-muted-foreground font-mono">
                                    {fullId}
                                </p>
                            )}
                        </div>
                    </>
                );

                if (href) {
                    return (
                        <Link key={idx} href={href} className={rowClass}>
                            {inner}
                        </Link>
                    );
                }

                return (
                    <div key={idx} className={cn(rowClass, 'cursor-default pointer-events-none')}>
                        {inner}
                    </div>
                );
            })}
        </ResultList>
    );
}


