'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Icon } from '@iconify/react';
import { PLATFORMS, ENGINES, formatSize } from '@/lib/platform';
import { getUser } from '@/lib/api/users';
import { formatNoxId } from '@/types/nox-identifier';
import type { ApiWorldAsset, ApiUser } from '@/types/api';
import { useTranslation } from 'react-i18next';
import { useApi } from '@/lib/api';

function UploaderChip({ noxRef }: { noxRef: string }) {
  const [user, setUser] = useState<ApiUser | undefined | null>(undefined);
  const { wellKnown } = useApi();

  useEffect(() => {
    getUser(noxRef).then(setUser).catch(() => setUser(null));
  }, [noxRef]);

  const displayName = user ? (user.display || user.username) : null;

  return (
    <Link href={`/u/${formatNoxId(noxRef, wellKnown?.address ?? '::')}`} className="flex items-center gap-1.5 no-underline group">
      <Avatar className="size-5 flex-shrink-0">
        {user?.thumbnail && <AvatarImage src={user.thumbnail} alt={displayName ?? formatNoxId(noxRef, wellKnown?.address ?? '::')} />}
        <AvatarFallback className="bg-primary/10 text-[10px]">
          {user === undefined ? null : displayName ? (
            displayName.charAt(0).toUpperCase()
          ) : (
            <Icon icon="material-symbols:person-rounded" className="size-3 text-muted-foreground" />
          )}
        </AvatarFallback>
      </Avatar>
      <span className="text-xs text-muted-foreground group-hover:underline">
        {displayName ?? formatNoxId(noxRef, wellKnown?.address ?? '::')}
      </span>
    </Link>
  );
}

function AssetRow({ asset, isRelease }: { asset: ApiWorldAsset; isRelease: boolean }) {
  const { t } = useTranslation();
  const platformInfo = PLATFORMS[asset.platform.toLowerCase()];
  const engineInfo = ENGINES[asset.engine.toLowerCase()];

  return (
    <div className="space-y-2 last:pb-0 py-2 first:pt-0">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Platform */}
        <div className="flex items-center gap-2 w-36 flex-shrink-0">
          {platformInfo ? (
            <Icon icon={platformInfo.icon} className="size-4 flex-shrink-0" style={{ color: platformInfo.color }} />
          ) : (
            <Icon icon="material-symbols:package-2" className="size-4 text-muted-foreground flex-shrink-0" />
          )}
          <span className="text-sm font-medium">
            {platformInfo ? t(platformInfo.label) : asset.platform}
          </span>
        </div>

        {/* Engine */}
        <div className="flex items-center gap-2 w-36 flex-shrink-0">
          {engineInfo ? (
            <Icon icon={engineInfo.icon} className="size-4 flex-shrink-0" style={{ color: engineInfo.color }} />
          ) : null}
          <span className="text-sm font-medium">
            {engineInfo ? t(engineInfo.label) : asset.engine}
          </span>
        </div>

        {/* Size */}
        <span className="text-sm text-muted-foreground flex-1">
          {asset.size ? formatSize(asset.size) : '—'}
        </span>

        {/* Hash */}
        {asset.hash && (
          <Tooltip>
            <TooltipTrigger
              render={<span />}
              className="hidden sm:block text-xs font-mono text-muted-foreground truncate max-w-[8rem] cursor-default"
            >
              {asset.hash.slice(0, 8)}…
            </TooltipTrigger>
            <TooltipContent>{asset.hash}</TooltipContent>
          </Tooltip>
        )}

        {isRelease && (
          <Badge variant="secondary" className="text-xs flex-shrink-0">release</Badge>
        )}
      </div>

      {/* Uploader + features */}
      {(asset.uploader || asset.features.length > 0) && (
        <div className="flex flex-wrap items-center gap-2">
          {asset.uploader && (
            <UploaderChip noxRef={asset.uploader} />
          )}
          {asset.features.map((f) => (
            <Badge key={f} variant="outline" className="text-xs font-normal">
              {f}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

interface VersionCardProps {
  version: number;
  assets: ApiWorldAsset[];
  isRelease: boolean;
}

export function VersionCard({ version, assets, isRelease }: VersionCardProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Icon icon="material-symbols:package-2" className="size-4 text-muted-foreground" />
          <span className="font-mono">v{version}</span>
          {isRelease && (
            <Badge className="text-xs">{t('world.release_recommended')}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className='divide-y divide-border'>
        {assets.map((a) => (
          <AssetRow key={a.id} asset={a} isRelease={isRelease} />
        ))}
      </CardContent>
    </Card>
  );
}
