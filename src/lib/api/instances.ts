import { apiFetch, apiFetchRaw } from './client';
import type { ApiInstance, ApiInstanceList } from '@/types/api';

export interface CreateInstancePayload {
    world: string;
    capacity: number;
    name?: string;
    title?: string;
    description?: string;
    tags?: string[];
    region?: string;
}

export function createInstance(payload: CreateInstancePayload): Promise<ApiInstance> {
    return apiFetch<ApiInstance>('/instances', {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
}

export function getInstance(id: number | string): Promise<ApiInstance> {
    return apiFetch<ApiInstance>(`/instances/${id}`);
}

export interface UpdateInstancePayload {
    title?: string;
    description?: string;
    capacity?: number;
    tags?: string[];
}

export function updateInstance(id: number | string, payload: UpdateInstancePayload): Promise<ApiInstance> {
    return apiFetch<ApiInstance>(`/instances/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });
}

export function searchInstances(query: string, limit: number, offset: number): Promise<ApiInstanceList> {
    let params = new URLSearchParams();
    if (query.trim()) params.set('q', query);
    params.set('limit', limit.toString());
    params.set('offset', offset.toString());
    return apiFetch<ApiInstanceList>(`/instances?${params.toString()}`);
}

export async function uploadInstanceThumbnail(id: number | string, blob: Blob): Promise<void> {
    const formData = new FormData();
    formData.append('file', blob, 'thumbnail');
    const res = await apiFetchRaw(`/instances/${id}/thumbnail`, {
        method: 'POST',
        body: formData,
    });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
}

export function getWorldInstances(worldId: number | string, limit = 20): Promise<ApiInstanceList> {
    const params = new URLSearchParams({ world: String(worldId), limit: String(limit) });
    return apiFetch<ApiInstanceList>(`/instances?${params.toString()}`);
}
