'use client';

import { useTranslation } from 'react-i18next';
import { AssetReleases } from '@/components/features/assets/AssetReleases';
import { useAsset } from '@/components/features/assets/AssetContext';

/** Releases tab of an asset, whatever its kind. */
export default function AssetReleasesPage() {
    const { asset } = useAsset();
    const { t } = useTranslation();

    // The layout renders its skeleton until the asset is loaded.
    if (!asset) return null;

    const empty = t('common.no_versions', { defaultValue: '' });

    return <AssetReleases asset={asset} emptyLabel={empty || undefined} />;
}
