'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useInstance } from './InstanceContext';
import { addUrlQuery } from '@/lib/url';
import { localeFlagUrl } from '@/lib/languages';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function InstanceBanner() {
  const { instance } = useInstance();
  const [error, setError] = useState(false);
  const [flagUrl, setFlagUrl] = useState<string | null>(null);

  const region = instance?.connection?.region ?? null;

  useEffect(() => {
    if (region) {
      localeFlagUrl(region).then(setFlagUrl);
    } else {
      setFlagUrl(null);
    }
  }, [region]);

  return (
    <div className="relative flex items-start bg-muted/50 border-b rounded-b-xl overflow-hidden">
      {error || !instance?.thumbnail ? (
        <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-primary/5" />
      ) : (
        <Image
          className="object-cover w-full"
          style={{ aspectRatio: '128 / 45' }}
          src={addUrlQuery(instance.thumbnail, 'size', '1024')}
          alt={instance.title}
          width={1024}
          height={360}
          priority
          onError={() => setError(true)}
        />
      )}

      {/* Region flag — top-left */}
      {flagUrl && (
        <Tooltip>
          <TooltipTrigger className="absolute top-3 left-3 z-10 rounded-md overflow-hidden shadow-md cursor-default">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={flagUrl}
              alt={region ?? 'region'}
              className="h-6 object-cover"
            />
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{region}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
