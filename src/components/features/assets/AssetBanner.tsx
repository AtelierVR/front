'use client';

import { ImageDisplay } from '@/components/shared/ImageDisplay';
import { EditCoverOverlay } from '@/components/shared/EditCoverOverlay';
import { useAsset } from './AssetContext';

/** Banner ratio (`1024 × 360`): the asset images are picked for it. */
const BANNER_RATIO = 128 / 45;

/** Banner of an asset, shared by every kind: the image best suited to the box. */
export function AssetBanner() {
    const { asset, kind, isOwner, isContributor } = useAsset();
    const canEdit = isOwner || isContributor;

    return (
        <div className="relative flex items-start bg-muted/50 border-b rounded-b-xl overflow-hidden">
            <ImageDisplay
                source={asset?.images}
                ratio={BANNER_RATIO}
                alt={asset?.title ?? asset?.name ?? undefined}
                priority
                sizes="100vw"
                fallbackClassName="bg-gradient-to-br from-primary/20 to-primary/5"
            />
            {canEdit && asset && kind && (
                <EditCoverOverlay href={`/${kind.key}/${asset.id}/edit#thumbnail`} iconSize={8} />
            )}
        </div>
    );
}
