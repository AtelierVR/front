'use client';

import { createContext, useContext } from 'react';
import type { ApiAsset, ApiConfigAsset } from '@/types/api';

/**
 * Context of the generic asset page (`/[key]/[id]`, see `(assets)/[key]/[id]`):
 * the asset itself, the instance declaration it was resolved from
 * (`GET /configs`, `assets`), and what the viewer may do with it.
 *
 * The kind-specific widgets read it through `useAsset<ApiWorld>()` and friends,
 * so one page serves every kind.
 */
export interface AssetContextValue<T extends ApiAsset = ApiAsset> {
    /** Asset of the current page, `null` until it is loaded. */
    asset: T | null;
    /** Declaration of the asset kind, from the instance config. */
    kind: ApiConfigAsset | null;
    isOwner: boolean;
    isContributor: boolean;
    refresh: () => void;
}

const EMPTY: AssetContextValue = {
    asset: null,
    kind: null,
    isOwner: false,
    isContributor: false,
    refresh: () => {},
};

export const AssetContext = createContext<AssetContextValue>(EMPTY);

/**
 * Asset of the current page, typed by the caller — `T` is an `ApiAsset`, so
 * `useAsset<ApiWorld>()` gives back a world.
 */
export function useAsset<T extends ApiAsset = ApiAsset>(): AssetContextValue<T> {
    return useContext(AssetContext) as AssetContextValue<T>;
}
