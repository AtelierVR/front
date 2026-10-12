'use client';

import { useAsset } from '@/components/features/assets/AssetContext';
import type { ApiAvatar } from '@/types/api';

/**
 * The asset page context, seen as an avatar — the page itself is generic
 * (`useAsset`), this is only the typed view the avatar widgets use.
 */
export function useAvatar() {
  const { asset, ...rest } = useAsset<ApiAvatar>();
  return { ...rest, asset, avatar: asset };
}
