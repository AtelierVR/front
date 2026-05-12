'use client';

import Link from 'next/link';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Identifier } from '@/components/shared/Identifier';
import { getAlias } from '@/lib/api';
import { useUser } from './UserContext';

export function UserDisplay() {
    const { user, isSame } = useUser();

    return (
        <div className="flex flex-col gap-1">
            <h1 className="group text-2xl font-bold flex items-center gap-2 font-heading">
                {user?.display ? (
                    <span>{user.display}</span>
                ) : (
                    <div className="animate-pulse rounded-md bg-muted h-8 w-1/3" />
                )}
                {isSame && (
                    <Link href="/settings/profile#display">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity size-7"
                        >
                            <Icon icon="material-symbols:edit-rounded" className="size-4" />
                        </Button>
                    </Link>
                )}
            </h1>
            {user?.username ? (
                <div className="flex items-center divide-x divide-border text-muted-foreground font-medium gap-2">
                    <Identifier value={getAlias(user.alias, 'uid')!} className='pe-2' />
                    {user.pronoun && <span className="font-medium">{user.pronoun}</span>}
                </div>
            ) : (
                <div className="animate-pulse rounded-md bg-muted h-4 w-1/3 mt-1" />
            )}
        </div>
    );
}
