'use client';

import React from 'react';
import { WorldInfo } from '@/components/features/worlds/WorldInfo';
import { WorldTagBox } from '@/components/features/worlds/WorldTagBox';
import { WorldContributors } from '@/components/features/worlds/WorldContributors';
import { WorldEditForm } from '@/components/features/worlds/WorldEditForm';
import { WorldInstances } from '@/components/features/worlds/WorldInstances';
import { SetHomeButton } from '@/components/features/worlds/SetHomeButton';
import { FavoriteButton as WorldFavoriteButton } from '@/components/features/worlds/FavoriteButton';
import { AvatarInfo } from '@/components/features/avatars/AvatarInfo';
import { AvatarTagBox } from '@/components/features/avatars/AvatarTagBox';
import { AvatarContributors } from '@/components/features/avatars/AvatarContributors';
import { AvatarEditForm } from '@/components/features/avatars/AvatarEditForm';
import { WearButton } from '@/components/features/avatars/WearButton';
import { FavoriteButton as AvatarFavoriteButton } from '@/components/features/avatars/FavoriteButton';

/**
 * Widgets a kind adds to the generic asset page.
 *
 * The page itself (`(assets)/[key]/[id]`) is kind-agnostic: it resolves the kind
 * from the instance config and renders these slots when the front has them. A
 * kind absent from this table still gets a working page — banner, identifier,
 * release compatibility, description, releases — without any code here.
 */

export interface AssetSlots {
    /** Info card of the sidebar. */
    Info?: React.ComponentType;
    /** Cards shown under the info one. */
    sidebar?: React.ReactNode;
    /** Actions rendered next to the display line. */
    actions?: React.ReactNode;
    /** Form opened by the page's edit drawer. */
    EditForm?: React.ComponentType;
    /** Tab the kind adds, e.g. the instances of a world. */
    instances?: { label: string; Page: React.ComponentType };
}

const ASSET_SLOTS: Record<string, AssetSlots> = {
    world: {
        Info: WorldInfo,
        sidebar: (
            <>
                <WorldTagBox />
                <WorldContributors />
            </>
        ),
        actions: (
            <>
                <SetHomeButton />
                <WorldFavoriteButton />
            </>
        ),
        EditForm: WorldEditForm,
        instances: { label: 'world.instances', Page: WorldInstances },
    },
    avatar: {
        Info: AvatarInfo,
        sidebar: (
            <>
                <AvatarTagBox />
                <AvatarContributors />
            </>
        ),
        actions: (
            <>
                <WearButton />
                <AvatarFavoriteButton />
            </>
        ),
        EditForm: AvatarEditForm,
    },
};

/** Slots declared for an asset kind (`{}` when the front has none for it). */
export function assetSlots(type: string): AssetSlots {
    return ASSET_SLOTS[type.toLocaleLowerCase()] ?? {};
}
