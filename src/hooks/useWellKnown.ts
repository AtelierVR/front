'use client';

import { useApi } from '@/lib/api/context';
import type { NoxWellKnown } from '@/types/wellknown';

export function useWellKnown(): NoxWellKnown | null {
  return useApi().wellKnown;
}
