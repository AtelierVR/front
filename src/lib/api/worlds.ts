import { apiFetch, apiFetchRaw } from './client';
import type { ApiWorld, ApiWorldList, ApiWorldAssetList } from '@/types/api';

export function getWorld(id: number | string): Promise<ApiWorld> {
    return apiFetch<ApiWorld>(`/worlds/${id}`);
}

export function searchWorlds(query: string, limit: number, offset: number): Promise<ApiWorldList> {
    let params = new URLSearchParams();
    if (query.trim()) params.set('q', query);
    params.set('limit', limit.toString());
    params.set('offset', offset.toString());
    return apiFetch<ApiWorldList>(`/worlds?${params.toString()}`);
}

export function getWorldAssets(id: number | string, version?: number): Promise<ApiWorldAssetList> {
    const params = new URLSearchParams();
    if (version !== undefined && version >= 0) params.set('version', String(version));
    const qs = params.toString();
    return apiFetch<ApiWorldAssetList>(`/worlds/${id}/assets${qs ? '?' + qs : ''}`);
}

export interface UpdateWorldPayload {
    name?: string | null;
    title?: string;
    description?: string | null;
    capacity?: number;
    release?: number | null;
    contributors?: string[];
    tags?: string[];
}

export function updateWorld(id: number | string, payload: UpdateWorldPayload): Promise<ApiWorld> {
    return apiFetch<ApiWorld>(`/worlds/${id}`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function uploadWorldThumbnail(id: number | string, blob: Blob): Promise<void> {
    const formData = new FormData();
    formData.append('file', blob, 'thumbnail');
    const res = await apiFetchRaw(`/worlds/${id}/thumbnail`, {
        method: 'POST',
        body: formData,
    });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
}
