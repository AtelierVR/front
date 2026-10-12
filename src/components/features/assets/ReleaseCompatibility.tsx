'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { assetEndpoint } from '@/lib/api/assets';
import { useApi } from '@/lib/api';
import { getReleaseFiles } from '@/lib/api/releases';
import { ENGINES, PLATFORMS, formatSize } from '@/lib/platform';
import { releaseVersion } from '@/types/api';
import type { ApiAsset, ApiReleaseFile } from '@/types/api';

/**
 * Compatibility of the recommended release of an asset, rendered as the items of
 * an asset header line (`identifier · platforms · engine · size`): the platforms
 * it ships for, the engine it was made with, and the size of its largest file.
 *
 * Renders a fragment on purpose — those lines space their items with `divide-x`,
 * so each item has to stay a direct child of the line.
 */

export interface ReleaseCompatibilityProps {
    /** Asset to describe: its recommended release is the one summarised. */
    asset: ApiAsset;
}

function attributeOf(file: ApiReleaseFile, key: string): string | null {
    const entry = file.attributes.find(
        (attribute) => attribute.key.toLowerCase() === key,
    );
    return entry && typeof entry.value === 'string' ? entry.value : null;
}

export function ReleaseCompatibility({ asset }: ReleaseCompatibilityProps) {
    const { t } = useTranslation();
    const { config } = useApi();
    const endpoint = assetEndpoint(config, asset);
    const preferredRelease = releaseVersion(asset.release);

    // Keyed by what was fetched: a change means the previous files no longer
    // apply, so they are simply ignored until the new ones arrive — no reset
    // effect needed.
    const [loaded, setLoaded] = useState<{ key: string; files: ApiReleaseFile[] } | null>(null);
    const key = `${endpoint}/${asset.id}/${preferredRelease}`;
    const files = loaded?.key === key ? loaded.files : null;

    useEffect(() => {
        // No release (or a kind the release API does not serve): nothing to show.
        if (!endpoint || preferredRelease < 0) return;
        let cancelled = false;
        getReleaseFiles(endpoint, asset.id, preferredRelease, { status: 'completed' })
            .then((page) => { if (!cancelled) setLoaded({ key, files: page.items }); })
            .catch(() => { if (!cancelled) setLoaded({ key, files: [] }); });
        return () => { cancelled = true; };
    }, [endpoint, asset.id, preferredRelease, key]);

    const { platforms, engines, largestSize } = useMemo(() => {
        const platforms: string[] = [];
        const engines: string[] = [];
        let largestSize: number | null = null;

        for (const file of files ?? []) {
            const platform = attributeOf(file, 'platform')?.trim().toLowerCase();
            if (platform && !platforms.includes(platform)) platforms.push(platform);

            // Engines may carry a version suffix (`unity:6000.4`).
            const engine = attributeOf(file, 'engine')?.split(':')[0].trim().toLowerCase();
            if (engine && !engines.includes(engine)) engines.push(engine);

            if (file.size !== null)
                largestSize = largestSize === null ? file.size : Math.max(largestSize, file.size);
        }

        return { platforms, engines, largestSize };
    }, [files]);

    if (platforms.length === 0 && engines.length === 0 && largestSize === null) return null;

    return (
        <>
            {platforms.length > 0 && (
                <span className="flex items-center gap-1 px-2">
                    {platforms.map((platform) => {
                        const info = PLATFORMS[platform];
                        if (!info)
                            return <span key={platform} className="text-xs font-mono">{platform}</span>;
                        return (
                            <Tooltip key={platform}>
                                <TooltipTrigger className="inline-flex">
                                    <Icon icon={info.icon} className="size-4" style={{ color: info.color }} />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t(info.label)}</p>
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}
                </span>
            )}

            {engines.length > 0 && (
                <span className="flex items-center gap-1 px-2">
                    {engines.map((engine) => {
                        const info = ENGINES[engine];
                        if (!info)
                            return <span key={engine} className="text-xs font-mono">{engine}</span>;
                        return (
                            <Tooltip key={engine}>
                                <TooltipTrigger className="inline-flex">
                                    <Icon icon={info.icon} className="size-4" style={{ color: info.color }} />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t(info.label)}</p>
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}
                </span>
            )}

            {largestSize !== null && (
                <span className="px-2 text-sm">{formatSize(largestSize)}</span>
            )}
        </>
    );
}
