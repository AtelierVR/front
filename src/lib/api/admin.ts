import { apiFetch } from './client';
import type { ApiLogEntry, ApiConfigEntry } from '@/types/api';

export function getServerLogs(limit = 500, after?: number): Promise<{ items: ApiLogEntry[]; total: number }> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (after !== undefined) params.set('after', String(after));
    return apiFetch<{ items: ApiLogEntry[]; total: number }>(`/logs?${params}`);
}

export function getEnvironment(): Promise<{ total: number; items: ApiConfigEntry[] }> {
    return apiFetch<{ total: number; items: ApiConfigEntry[] }>('/environment');
}

export function patchEnvironment(items: { key: string; value: string | null }[]): Promise<{ results: { key: string; ok: boolean; error?: string }[] }> {
    return apiFetch<{ results: { key: string; ok: boolean; error?: string }[] }>('/environment', {
        method: 'POST',
        body: JSON.stringify(items),
    });
}
