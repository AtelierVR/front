'use client';

import Image from 'next/image';
import { useState } from 'react';
import { EditCoverOverlay } from '@/components/shared/EditCoverOverlay';
import { useUser } from './UserContext';
import { addUrlQuery } from '@/lib/url';

export function UserBanner() {
  const { user, isSame } = useUser();
  const [error, setError] = useState(false);

  return (
    <div className="relative flex items-start bg-muted/50 border-b rounded-b-xl overflow-hidden">
      {error || !user?.banner ? (
        <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-primary/5" />
      ) : (
        <Image
          className="object-cover w-full"
          style={{ aspectRatio: '128 / 45' }}
          src={addUrlQuery(user.banner, 'size', '1024')}
          alt={user.display || 'Banner'}
          width={1024}
          height={360}
          priority
          onError={() => setError(true)}
        />
      )}
      {isSame && <EditCoverOverlay href="/settings/profile#banner" iconSize={8} />}
    </div>
  );
}
