'use client';

import { useApi } from '@/lib/api/context';
import type { ApiCurrentUser } from '@/types/api';

export function useCurrentUser(): ApiCurrentUser | null {
  return useApi().currentUser;
}
