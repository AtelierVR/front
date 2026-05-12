'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { ApiUser } from '@/types/api';
import { DOT_COLORS } from './PresenceBadge';

interface PresenceOverlayProps {
    user: ApiUser;
    isSame: boolean;
}

const PILL = 'absolute top-3 left-3 z-10 flex items-center gap-2 rounded-full backdrop-blur-md bg-black/40 px-3 py-1.5';

export function PresenceOverlay({ user, isSame }: PresenceOverlayProps) {
    const dot = DOT_COLORS[user.presence.status] ?? DOT_COLORS.offline;

    const inner = <>
        <span className={cn('h-2.5 w-2.5 rounded-full shrink-0', dot)} />
        {user.presence.text && (
            <span className="text-sm font-medium text-white">{user.presence.text}</span>
        )}
    </>;

    if (isSame)
        return <Link href="/settings/profile#presence" className={cn(PILL, 'hover:bg-black/50 transition-colors')}>
            {inner}
        </Link>;

    return <div className={PILL}>{inner}</div>;
}
