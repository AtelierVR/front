'use client';

import React, { createContext, useContext } from 'react';
import type { ApiWorld, ApiWorldAsset } from '@/types/api';

interface WorldContextValue {
  world: ApiWorld | null;
  allAssets: ApiWorldAsset[] | null;
  isOwner: boolean;
  isContributor: boolean;
  refresh: () => void;
}

export const WorldContext = createContext<WorldContextValue>({
  world: null,
  allAssets: null,
  isOwner: false,
  isContributor: false,
  refresh: () => {},
});

export function useWorld() {
  return useContext(WorldContext);
}
