'use client';

import { useState, useEffect, useMemo } from 'react';
import { useInstance } from './InstanceContext';
import { ImageDisplay } from '@/components/shared/ImageDisplay';
import { imageList } from '@/types/api';
import { localeFlagUrl } from '@/lib/languages';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function InstanceBanner() {
  const { instance, world } = useInstance();
  const [flagUrl, setFlagUrl] = useState<string | null>(null);

  const region = instance?.connection?.region ?? null;

  useEffect(() => {
    if (region) {
      localeFlagUrl(region).then(setFlagUrl);
    } else {
      setFlagUrl(null);
    }
  }, [region]);

  const banner = useMemo(
    () => [instance?.thumbnail, ...imageList(world?.images)],
    [instance?.thumbnail, world?.images],
  );

  return (
    <div className="relative flex items-start bg-muted/50 border-b rounded-b-xl overflow-hidden">
      <ImageDisplay
        source={banner}
        ratio={128 / 45}
        alt={instance?.title ?? world?.title}
        sizes="100vw"
        fallbackClassName="bg-gradient-to-br from-primary/20 to-primary/5"
      />

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
