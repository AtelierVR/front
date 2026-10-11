'use client';

import { useApi } from '@/lib/api/context';

/** Advanced mode is enabled by the `usr:developer` tag on the signed-in user. */
export function useDeveloperMode(): boolean {
    const { currentUser } = useApi();
    return currentUser?.tags?.includes('usr:developer') ?? false;
}
