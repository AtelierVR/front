import { apiFetch } from './client';
import type { ApiActivityEvent, ApiActivityList } from '@/types/api';

export function listActivity(params: { q?: string; limit?: number; offset?: number } = {}): Promise<ApiActivityList> {
    const qs = new URLSearchParams();
    if (params.q) qs.set('q', params.q);
    if (params.limit !== undefined) qs.set('limit', String(params.limit));
    if (params.offset !== undefined) qs.set('offset', String(params.offset));
    return apiFetch<ApiActivityList>(`/activity?${qs}`);
}

export function deleteActivity(id: number): Promise<void> {
    return apiFetch<void>(`/activity/${id}`, { method: 'DELETE' });
}

export type { ApiActivityEvent };
