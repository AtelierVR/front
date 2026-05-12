'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useInstance } from './InstanceContext';

export function InstanceBanner() {
  const { instance } = useInstance();
  const [error, setError] = useState(false);

  return (
    <div className="relative flex items-start bg-muted/50 border-b rounded-b-xl overflow-hidden">
      {error || !instance?.thumbnail ? (
        <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-primary/5" />
      ) : (
        <Image
          className="object-cover w-full"
          style={{ aspectRatio: '128 / 45' }}
          src={instance.thumbnail}
          alt={instance.title}
          width={1024}
          height={360}
          priority
          onError={() => setError(true)}
        />
      )}
    </div>
  );
}
