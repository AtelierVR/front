'use client';

import { notFound } from 'next/navigation';
import { useAsset } from '@/components/features/assets/AssetContext';
import { assetSlots } from '@/components/features/assets/asset-slots';

/**
 * Extra tab of a kind, when it declares one (a world lists its instances).
 * Kinds without an extra tab have no content here.
 */
export default function AssetExtraTabPage() {
    const { asset } = useAsset();
    const slots = asset ? assetSlots(asset.type) : {};

    if (!slots.instances) notFound();
    return <slots.instances.Page />;
}
