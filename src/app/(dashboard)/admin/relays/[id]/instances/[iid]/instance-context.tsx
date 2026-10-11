'use client';

import { createContext, useContext } from 'react';
import type { ApiInstance } from '@/types/api';

export interface RelayInstanceTpsInfo {
    tps: number | null;
    threshold: number | null;
    effective_tps: number | null;
    effective_threshold: number | null;
}

interface RelayInstanceContextValue {
    iid: string;
    instance: ApiInstance | null;
    loading: boolean;
    error: string | undefined;
    refresh: () => void;
    tpsInfo: RelayInstanceTpsInfo | null;
}

const RelayInstanceContext = createContext<RelayInstanceContextValue | null>(null);

export function useRelayInstance(): RelayInstanceContextValue {
    const ctx = useContext(RelayInstanceContext);
    if (!ctx) throw new Error('useRelayInstance must be used inside RelayInstanceProvider');
    return ctx;
}

export { RelayInstanceContext };
