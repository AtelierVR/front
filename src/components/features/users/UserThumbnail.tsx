'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { EditCoverOverlay } from '@/components/shared/EditCoverOverlay';
import { useUser } from './UserContext';

export function UserThumbnail() {
  const { user, isSame } = useUser();
  const [error, setError] = useState(false);

  return (
    <div
      className={cn(
        'w-[8em] h-[8em]',
        'border border-border rounded-xl overflow-hidden',
        'absolute -top-[6em]',
        'bg-background',
      )}
    >
      {!user || error || !user.thumbnail ? (
        <div className="w-full h-full bg-muted animate-pulse" />
      ) : (
        <Image
          className="w-full h-full object-cover"
          src={user.thumbnail}
          alt={user.display || 'Thumbnail'}
          width={256}
          height={256}
          priority
          onError={() => setError(true)}
        />
      )}
      {isSame && <EditCoverOverlay href="/settings/profile#thumbnail" iconSize={7} />}
    </div>
  );
}
