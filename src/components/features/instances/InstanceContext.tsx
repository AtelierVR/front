'use client';

import React, { createContext, useContext } from 'react';
import type { ApiInstance, ApiUser, ApiWorld, ApiWorldAsset } from '@/types/api';

interface InstanceContextValue {
  instance: ApiInstance | null;
  world: ApiWorld | null;
  owner: ApiUser | null;
  worldAssets: ApiWorldAsset[] | null;
  isOwner: boolean;
  refresh: () => void;
}

export const InstanceContext = createContext<InstanceContextValue>({
  instance: null,
  world: null,
  owner: null,
  worldAssets: null,
  isOwner: false,
  refresh: () => {},
});

export function useInstance() {
  return useContext(InstanceContext);
}
