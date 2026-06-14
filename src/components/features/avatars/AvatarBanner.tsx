'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useAvatar } from './AvatarContext';
import { addUrlQuery } from '@/lib/url';

export function AvatarBanner() {
  const { avatar } = useAvatar();
  const [error, setError] = useState(false);

  return (
    <div className="relative flex items-start bg-muted/50 border-b rounded-b-xl overflow-hidden">
      {error || !avatar?.thumbnail ? (
        <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-primary/5" />
      ) : (
        <Image
          className="object-cover w-full"
          style={{ aspectRatio: '128 / 45' }}
          src={addUrlQuery(avatar.thumbnail, 'size', '1024')}
          alt={avatar.title}
          width={1024}
          height={360}
          priority
          onError={() => setError(true)}
        />
      )}
    </div>
  );
}
