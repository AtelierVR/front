'use client';

import { createContext, useContext } from 'react';
import type { ApiInstance } from '@/types/api';

interface RelayInstanceContextValue {
    iid: string;
    instance: ApiInstance | null;
    loading: boolean;
    error: string | undefined;
    refresh: () => void;
}

const RelayInstanceContext = createContext<RelayInstanceContextValue | null>(null);

export function useRelayInstance(): RelayInstanceContextValue {
    const ctx = useContext(RelayInstanceContext);
    if (!ctx) throw new Error('useRelayInstance must be used inside RelayInstanceProvider');
    return ctx;
}

export { RelayInstanceContext };
