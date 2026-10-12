'use client';

import Link from 'next/link';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { AssetInfoLine } from '@/components/features/assets/AssetInfoLine';
import { useAsset } from './AssetContext';
import { cn } from '@/lib/utils';

/**
 * Title of an asset and the line under it: identifier, platforms, engine and
 * largest file of its recommended release.
 */
export function AssetDisplay(props: { className?: string }) {
    const { asset, kind, isOwner, isContributor } = useAsset();
    const canEdit = isOwner || isContributor;
    const title = asset?.title ?? asset?.name ?? null;

    return (
        <div className={cn('flex flex-col gap-1', props.className)}>
            <h1 className="group text-2xl font-bold font-heading flex items-center gap-2">
                {title
                    ? <span>{title}</span>
                    : <div className="animate-pulse rounded-md bg-muted h-8 w-48" />}
                {canEdit && asset && kind && (
                    <Link href={`/${kind.key}/${asset.id}/edit#title`}>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity size-7">
                            <Icon icon="material-symbols:edit-rounded" className="size-4" />
                        </Button>
                    </Link>
                )}
            </h1>

            {asset ? (
                <AssetInfoLine asset={asset} />
            ) : (
                <div className="animate-pulse rounded-md bg-muted h-4 w-2/3" />
            )}
        </div>
    );
}
