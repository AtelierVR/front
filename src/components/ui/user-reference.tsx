'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { Skeleton } from '@/components/ui/skeleton';
import { Identifier } from '@/components/ui/identifier';
import { useApi } from '@/lib/api/context';
import { getUser } from '@/lib/api/users';
import { getAlias } from '@/lib/api';
import { formatNoxId } from '@/types/nox-identifier';
import { cn } from '@/lib/utils';
import { AvatarWithPresence } from '@/components/ui/avatar-with-presence';
import type { ApiUser } from '@/types/api';

// ── Shared props ──────────────────────────────────────────────────────────────

interface UserReferenceBase {
  /** Additional CSS classes */
  className?: string;
}

interface UserReferenceWithUser extends UserReferenceBase {
  /** Pre-loaded user object. Component will NOT fetch. */
  user: ApiUser;
  noxId?: never;
}

interface UserReferenceWithNoxId extends UserReferenceBase {
  /** Nox identifier string (e.g. "42@server.com"). Component will fetch the user. */
  noxId: string;
  user?: never;
}

// ── Compact variant ───────────────────────────────────────────────────────────

type UserReferenceCompactProps = (UserReferenceWithUser | UserReferenceWithNoxId) & {
  compact: true;
  /** When true, shows the identifier (@server) below the display name. Default false. */
  showIdentifier?: boolean;
};

/**
 * Compact variant: small avatar (size-6) + display name.
 * Used in activity feeds, tables, etc.
 *
 * @example
 * <UserReference compact noxId="42@server.com" />
 * <UserReference compact user={apiUser} />
 */
function UserReferenceCompact({
  user: preloadedUser,
  noxId,
  showIdentifier = false,
  className,
}: UserReferenceCompactProps) {
  const { wellKnown } = useApi();
  const localAddress = wellKnown?.address ?? '::';
  const [fetchedUser, setFetchedUser] = useState<ApiUser | null | undefined>(
    preloadedUser ?? undefined,
  );

  useEffect(() => {
    if (preloadedUser || !noxId) return;
    let cancelled = false;
    getUser(noxId)
      .then((u) => { if (!cancelled) setFetchedUser(u); })
      .catch(() => { if (!cancelled) setFetchedUser(null); });
    return () => { cancelled = true; };
  }, [noxId, preloadedUser]);

  const user = preloadedUser ?? fetchedUser;
  const isLoading = user === undefined;

  if (isLoading) {
    return (
      <span className={cn('flex items-center gap-2', className)}>
        <Skeleton className="size-6 rounded-full shrink-0" />
        <Skeleton className="h-4 w-20 rounded" />
      </span>
    );
  }

  const displayName = user?.display ?? user?.username ?? null;
  const fallbackId = noxId ? formatNoxId(noxId, localAddress) : (user ? `${user.username}@${user.server}` : 'unknown');
  const href = user ? (noxId ? `/u/${formatNoxId(noxId, localAddress)}` : `/u/${user.username}`) : '#';

  const initials = displayName ? displayName.slice(0, 2).toUpperCase() : '?';

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2 w-fit hover:underline underline-offset-2 group',
        className,
      )}
    >
      <AvatarWithPresence
        presence={user?.presence.status}
        size="sm"
        src={user?.thumbnail}
        alt={displayName ?? fallbackId}
        fallback={initials}
      />
      <div className={cn('flex flex-col', !showIdentifier && 'flex-row items-center gap-1.5')}>
        <span className="text-sm font-medium group-hover:text-primary transition-colors">
          {displayName ?? fallbackId}
        </span>
        {showIdentifier && user && (
          <Identifier
            value={getAlias(user.alias, 'uid') ?? `${user.id}@${user.server}`}
            className="text-[10px]"
          />
        )}
      </div>
    </Link>
  );
}

// ── Normal variant ────────────────────────────────────────────────────────────

type UserReferenceNormalProps = (UserReferenceWithUser | UserReferenceWithNoxId) & {
  compact?: false | undefined;
  /** When true, shows a star icon next to the display name (for owner). */
  isOwner?: boolean;
};

/**
 * Normal variant: medium avatar (size-8) + display name + identifier below.
 * Used in contributor lists, owner cards, etc.
 *
 * @example
 * <UserReference noxId="42@server.com" isOwner />
 * <UserReference user={apiUser} />
 */
function UserReferenceNormal({
  user: preloadedUser,
  noxId,
  isOwner = false,
  className,
}: UserReferenceNormalProps) {
  const { wellKnown } = useApi();
  const localAddress = wellKnown?.address ?? '::';
  const [fetchedUser, setFetchedUser] = useState<ApiUser | null | undefined>(
    preloadedUser ?? undefined,
  );

  useEffect(() => {
    if (preloadedUser || !noxId) return;
    let cancelled = false;
    getUser(noxId)
      .then((u) => { if (!cancelled) setFetchedUser(u); })
      .catch(() => { if (!cancelled) setFetchedUser(null); });
    return () => { cancelled = true; };
  }, [noxId, preloadedUser]);

  const user = preloadedUser ?? fetchedUser;
  const isLoading = user === undefined;

  if (isLoading) {
    return (
      <span className={cn('flex items-center gap-3', className)}>
        <Skeleton className="size-8 rounded-full shrink-0" />
        <div className="flex-1 space-y-1">
          <Skeleton className="h-3.5 w-28 rounded" />
          <Skeleton className="h-3 w-20 rounded" />
        </div>
      </span>
    );
  }

  const displayName = user?.display ?? user?.username ?? null;
  const fallbackId = noxId ? formatNoxId(noxId, localAddress) : (user ? `${user.username}@${user.server}` : 'unknown');
  const href = user ? (noxId ? `/u/${formatNoxId(noxId, localAddress)}` : `/u/${user.username}`) : '#';

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 text-sm group no-underline',
        className,
      )}
    >
      <AvatarWithPresence
        presence={user?.presence.status}
        size="default"
        src={user?.thumbnail}
        alt={displayName ?? fallbackId}
        fallback={
          displayName ? (
            displayName.charAt(0).toUpperCase()
          ) : (
            <Icon icon="material-symbols:person-rounded" className="size-4 text-muted-foreground" />
          )
        }
      />
      <div className="flex-1 min-w-0">
        {displayName ? (
          <>
            <div className="flex items-center gap-1 font-medium truncate">
              <span className="group-hover:text-primary transition-colors">
                {displayName}
              </span>
              {isOwner && (
                <Icon
                  icon="material-symbols:star-rounded"
                  className="size-3 text-muted-foreground shrink-0"
                />
              )}
            </div>
            {user && (
              <Identifier
                value={getAlias(user.alias, 'uid') ?? `${user.id}@${user.server}`}
                className="text-xs text-muted-foreground cursor-pointer"
                clickable={false}
              />
            )}
          </>
        ) : (
          <div className="flex items-center gap-1 font-mono text-xs truncate">
            {isOwner && (
              <Icon
                icon="material-symbols:star-rounded"
                className="size-3 text-muted-foreground shrink-0"
              />
            )}
            <span className="group-hover:underline">{fallbackId}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

// ── Exported union type ───────────────────────────────────────────────────────

export type UserReferenceProps =
  | UserReferenceCompactProps
  | UserReferenceNormalProps;

/**
 * Displays a user with avatar and display name, linking to their profile page.
 *
 * Two variants:
 * - **compact**: small avatar + display name (for tables, activity feeds)
 * - **normal** (default): medium avatar + display name + identifier (for contributor lists)
 *
 * @example
 * // Compact (activity feed author)
 * <UserReference compact noxId="42@server.com" />
 *
 * // Normal (contributor list)
 * <UserReference noxId="42@server.com" isOwner />
 * <UserReference user={apiUser} />
 */
export function UserReference(props: UserReferenceProps) {
  if (props.compact) {
    return <UserReferenceCompact {...props} />;
  }
  return <UserReferenceNormal {...props} />;
}
