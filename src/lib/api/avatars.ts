import { apiFetch, apiFetchRaw } from './client';
import type { ApiAvatar, ApiAvatarList, ApiAvatarAssetList } from '@/types/api';

export function getAvatar(id: number | string): Promise<ApiAvatar> {
    return apiFetch<ApiAvatar>(`/avatars/${id}`);
}

export function searchAvatars(query: string, limit: number, offset: number): Promise<ApiAvatarList> {
    let params = new URLSearchParams();
    if (query.trim()) params.set('q', query);
    params.set('limit', limit.toString());
    params.set('offset', offset.toString());
    return apiFetch<ApiAvatarList>(`/avatars?${params.toString()}`);
}

export function getAvatarAssets(id: number | string, version?: number): Promise<ApiAvatarAssetList> {
    const params = new URLSearchParams();
    if (version !== undefined && version >= 0) params.set('version', String(version));
    const qs = params.toString();
    return apiFetch<ApiAvatarAssetList>(`/avatars/${id}/assets${qs ? '?' + qs : ''}`);
}

export interface UpdateAvatarPayload {
    name?: string | null;
    title?: string;
    description?: string | null;
    release?: number | null;
    contributors?: string[];
}

export function updateAvatar(id: number | string, payload: UpdateAvatarPayload): Promise<ApiAvatar> {
    return apiFetch<ApiAvatar>(`/avatars/${id}`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export async function uploadAvatarThumbnail(id: number | string, blob: Blob): Promise<void> {
    const formData = new FormData();
    formData.append('file', blob, 'thumbnail');
    const res = await apiFetchRaw(`/avatars/${id}/thumbnail`, {
        method: 'POST',
        body: formData,
    });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
}
