'use client';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { VersionCard } from '@/components/features/worlds/VersionCard';
import { useWorld } from '@/components/features/worlds/WorldContext';
import { useTranslation } from 'react-i18next';
import type { ApiWorldAsset } from '@/types/api';

export default function WorldVersionsPage() {
    const { world, allAssets } = useWorld();
    const { t } = useTranslation();

    if (!world || allAssets === null)
        return <div className="space-y-4">
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
        </div>;

    if (allAssets.length === 0)
        return <div className="text-center text-muted-foreground border border-dashed rounded-xl py-12">
            {t('world.no_versions')}
        </div>;

    // Group by version, sort descending
    const byVersion: Record<number, ApiWorldAsset[]> = {};
    for (const asset of allAssets)
        (byVersion[asset.version] ??= []).push(asset);
    const versions = Object.keys(byVersion).map(Number).sort((a, b) => b - a);

    return <div className="space-y-4">
        {versions.map((v) => <VersionCard
            key={v}
            version={v}
            assets={byVersion[v]}
            isRelease={v === world.release.resolved}
        />)}
    </div>;
}
