'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Icon } from '@iconify/react';
import type { ApiUser } from '@/types/api';
import { PresenceIcon } from '@/lib/presences';

interface PresenceOverlayProps {
    user: ApiUser;
    isSame: boolean;
}

const PILL = 'absolute top-3 left-3 z-10 flex items-center gap-2 rounded-full backdrop-blur-md bg-black/40 px-3 py-1.5 group transition-all duration-300 ease-out w-fit';

export function PresenceOverlay({ user, isSame }: PresenceOverlayProps) {
    const inner = <>
        <PresenceIcon id={user.presence.status} svgClassName="h-2.5! w-2.5! shrink-0" />
        {user.presence.text && (
            <span className="text-sm font-medium text-white">{user.presence.text}</span>
        )}
    </>;

    if (isSame)
        return <Link href="/settings/profile#presence" className={cn(PILL, 'hover:bg-black/50')}>
            {inner}
            <span className="inline-flex items-center w-0 overflow-hidden group-hover:w-4 -ml-2 group-hover:ml-0 transition-all duration-300">
                <Icon
                    icon="material-symbols:edit-rounded"
                    className="size-4 text-white/70 shrink-0"
                />
            </span>
        </Link>;

    return <div className={PILL}>{inner}</div>;
}
