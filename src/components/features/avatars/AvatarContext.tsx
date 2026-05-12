'use client';

import React, { createContext, useContext } from 'react';
import type { ApiAvatar, ApiAvatarAsset } from '@/types/api';

interface AvatarContextValue {
  avatar: ApiAvatar | null;
  allAssets: ApiAvatarAsset[] | null;
  isOwner: boolean;
  isContributor: boolean;
  refresh: () => void;
}

export const AvatarContext = createContext<AvatarContextValue>({
  avatar: null,
  allAssets: null,
  isOwner: false,
  isContributor: false,
  refresh: () => {},
});

export function useAvatar() {
  return useContext(AvatarContext);
}
