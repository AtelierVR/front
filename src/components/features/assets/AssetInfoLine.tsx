'use client';

import { getAlias } from '@/lib/api';
import { Identifier } from '@/components/ui/identifier';
import { ReleaseCompatibility } from '@/components/features/assets/ReleaseCompatibility';
import { cn } from '@/lib/utils';
import type { ApiAsset } from '@/types/api';

/**
 * Header line of an asset page, shared by `/w` and `/a`: the copyable Nox
 * identifier first, then what the recommended release runs on (platforms,
 * engine, largest file size). Items are separated by a divider, so every item
 * has to stay a direct child of this row.
 */

export interface AssetInfoLineProps {
    /** Asset to describe. */
    asset: ApiAsset;
    className?: string;
}

export function AssetInfoLine({ asset, className }: AssetInfoLineProps) {
    const identifier = getAlias(asset.alias, 'nid') 
        ?? getAlias(asset.alias, 'iid')
        ?? `${asset.name ?? asset.id}@${asset.server}`;

    return (
        <div
            className={cn(
                'flex items-center flex-wrap divide-x divide-border text-muted-foreground font-medium gap-y-1',
                className,
            )}>
            {identifier && <span className="pe-2">
                <Identifier value={identifier} />
            </span>}
            <ReleaseCompatibility asset={asset} />
        </div>
    );
}
