'use client';

import Image from '@/components/NoxImage';
import { useState } from 'react';
import { EditCoverOverlay } from '@/components/shared/EditCoverOverlay';
import { useWorld } from './WorldContext';

export function WorldBanner() {
  const { world, isOwner } = useWorld();
  const [error, setError] = useState(false);

  return (
    <div className="relative flex items-start bg-muted/50 border-b rounded-b-xl overflow-hidden">
      {error || !world?.thumbnail ? (
        <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-primary/5" />
      ) : (
        <Image
          className="object-cover w-full"
          style={{ aspectRatio: '128 / 45' }}
          src={world.thumbnail}
          alt={world.title}
          width={1024}
          height={360}
          priority
          onError={() => setError(true)}
        />
      )}
      {isOwner && <EditCoverOverlay href={`/w/${world?.id}/settings#thumbnail`} iconSize={8} />}
    </div>
  );
}
