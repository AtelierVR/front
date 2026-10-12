'use client';

import { useAsset } from '@/components/features/assets/AssetContext';
import type { ApiWorld } from '@/types/api';

/**
 * The asset page context, seen as a world — the page itself is generic
 * (`useAsset`), this is only the typed view the world widgets use.
 */
export function useWorld() {
  const { asset, ...rest } = useAsset<ApiWorld>();
  return { ...rest, asset, world: asset };
}
