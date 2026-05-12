'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { getUser } from '@/lib/api/users';
import { formatNoxId, parseNoxId } from '@/types/nox-identifier';
import { useApi } from '@/lib/api/context';
import type { ApiUser } from '@/types/api';

// ── Single row ────────────────────────────────────────────────────────────────

interface UserRowProps {
    noxRef: string;
    onRemove?: () => void;
    localAddress: string;
}

function UserRow({ noxRef, onRemove, localAddress }: UserRowProps) {
    const [user, setUser] = useState<ApiUser | null | undefined>(undefined);

    useEffect(() => {
        getUser(noxRef).then(setUser).catch(() => setUser(null));
    }, [noxRef]);

    const displayName = user ? (user.display || user.username) : null;
    const fallback = formatNoxId(noxRef, localAddress);
    const initials = displayName ? displayName.charAt(0).toUpperCase() : null;

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-card hover:bg-muted/50 transition-colors">
            <Avatar className="size-7 flex-shrink-0">
                {user?.thumbnail && <AvatarImage src={user.thumbnail} alt={displayName ?? fallback} />}
                <AvatarFallback className="bg-primary/10 text-xs">
                    {user === undefined ? null : initials ?? <Icon icon="material-symbols:person-rounded" className="size-3.5 text-muted-foreground" />}
                </AvatarFallback>
            </Avatar>

            {user === undefined ? (
                <div className="flex-1 space-y-1">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-3 w-20" />
                </div>
            ) : (
                <Link href={`/u/${fallback}`} className="flex-1 min-w-0 flex flex-col no-underline group">
                    <span className="text-sm font-medium truncate group-hover:underline">
                        {displayName ?? fallback}
                    </span>
                    {displayName && (
                        <span className="text-xs text-muted-foreground font-mono truncate">{fallback}</span>
                    )}
                </Link>
            )}

            {onRemove && (
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={onRemove}
                    aria-label="Remove user"
                    className="flex-shrink-0"
                >
                    <Icon icon="material-symbols:close-rounded" className="size-3.5" />
                </Button>
            )}
        </div>
    );
}

// ── UserListInput ─────────────────────────────────────────────────────────────

interface UserListInputProps {
    /** NoxIdentifier strings, e.g. ["u:42@nox.example.com"] */
    users: string[];
    onChange: (users: string[]) => void;
    /** If false, the add field and remove buttons are hidden. */
    editable?: boolean;
    placeholder?: string;
    className?: string;
    emptyLabel?: string;
}

export function UserListInput({
    users,
    onChange,
    editable = true,
    placeholder = '42@nox.example',
    className,
    emptyLabel = 'No users yet.',
}: UserListInputProps) {
    const { wellKnown } = useApi();
    const localAddress = wellKnown?.address ?? '::';
    const [draft, setDraft] = useState('');

    const addUser = () => {
        const sid = draft.trim();
        if (!sid || users.includes(sid)) return;
        onChange([...users, sid]);
        setDraft('');
    };

    const removeUser = (noxRef: string) => {
        onChange(users.filter((u) => u !== noxRef));
    };

    return (
        <div className={cn('space-y-2', className)}>
            {users.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4 border border-dashed border-border rounded-lg">
                    {emptyLabel}
                </div>
            )}

            {users.length > 0 && (
                <div className="rounded-lg border border-border overflow-hidden divide-y divide-border">
                    {users.map((noxRef) => (
                        <UserRow
                            key={noxRef}
                            noxRef={noxRef}
                            localAddress={localAddress}
                            onRemove={editable ? () => removeUser(noxRef) : undefined}
                        />
                    ))}
                </div>
            )}

            {editable && (
                <div className="flex items-center gap-2 pt-1">
                    <Input
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUser())}
                        placeholder={placeholder}
                        className="flex-1"
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={addUser}
                        disabled={!draft.trim()}
                    >
                        <Icon icon="material-symbols:add-rounded" className="size-4 mr-1" />
                        Add
                    </Button>
                </div>
            )}
        </div>
    );
}
