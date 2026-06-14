'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAvatar } from '@/components/features/avatars/AvatarContext';
import { useTranslation } from 'react-i18next';
import type { ApiAvatarAsset } from '@/types/api';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@iconify/react';
import { PLATFORMS, ENGINES, formatSize } from '@/lib/platform';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getUser } from '@/lib/api/users';
import { formatNoxId } from '@/types/nox-identifier';
import { useApi } from '@/lib/api';
import type { ApiUser } from '@/types/api';

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

function AssetRow({ asset, isRelease }: { asset: ApiAvatarAsset; isRelease: boolean }) {
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
                    <Badge variant="secondary" className="text-xs flex-shrink-0">
                        {t('avatar.release_recommended')}
                    </Badge>
                )}
            </div>

            {(asset.uploader || asset.features.length > 0) && (
                <div className="flex flex-wrap items-center gap-2">
                    {asset.uploader && <UploaderChip noxRef={asset.uploader} />}
                    {asset.features.map((f) => (
                        <Badge key={f} variant="outline" className="text-xs font-normal">{f}</Badge>
                    ))}
                </div>
            )}
        </div>
    );
}

function VersionCard({ version, assets, isRelease }: { version: number; assets: ApiAvatarAsset[]; isRelease: boolean }) {
    const { t } = useTranslation();
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    v{version}
                    {isRelease && (
                        <Badge variant="secondary" className="text-xs">{t('avatar.release_recommended')}</Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border">
                {assets.map((asset) => (
                    <AssetRow key={asset.id} asset={asset} isRelease={isRelease} />
                ))}
            </CardContent>
        </Card>
    );
}

export default function AvatarVersionsPage() {
    const { avatar, allAssets } = useAvatar();
    const { t } = useTranslation();

    if (!avatar || allAssets === null)
        return (
            <div className="space-y-4">
                {[0, 1].map((i) => (
                    <Card key={i}>
                        <div className="p-4 pb-2">
                            <Skeleton className="h-5 w-24" />
                        </div>
                        <div className="px-4 pb-4 space-y-3">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </Card>
                ))}
            </div>
        );

    if (allAssets.length === 0)
        return (
            <div className="text-center text-muted-foreground border border-dashed rounded-xl py-12">
                {t('avatar.no_versions')}
            </div>
        );

    const byVersion: Record<number, ApiAvatarAsset[]> = {};
    for (const asset of allAssets)
        (byVersion[asset.version] ??= []).push(asset);
    const versions = Object.keys(byVersion).map(Number).sort((a, b) => b - a);

    return (
        <div className="space-y-4">
            {versions.map((v) => (
                <VersionCard
                    key={v}
                    version={v}
                    assets={byVersion[v]}
                    isRelease={v === avatar.release.resolved}
                />
            ))}
        </div>
    );
}
