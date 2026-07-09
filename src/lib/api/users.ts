import { apiFetch, apiFetchRaw, dispatchCurrentUserReplace } from './client';
import { getWellKnownAddress } from './wellknown';
import type { ApiUser, ApiCurrentUser, ApiLink, ApiUserSearchResult, ApiPublicTableList, ApiRelationListResult } from '@/types/api';
import type { ApiErrorDetails } from '@/types/envelope';
import { ApiError } from '@/types/envelope';

export function getUser(username: string): Promise<ApiUser> {
    return apiFetch<ApiUser>(`/users/${username}`);
}

export function searchUsers(query: string, limit: number, offset: number): Promise<ApiUserSearchResult> {
    let params = new URLSearchParams();
    if (query.trim()) params.set('q', query);
    params.set('limit', limit.toString());
    params.set('offset', offset.toString());
    return apiFetch<ApiUserSearchResult>(`/users?${params.toString()}`);
}

export function followUser(userId: number): Promise<{ type: string }> {
    return apiFetch<{ type: string }>(`/users/${userId}/follow`, { method: 'POST' });
}

export function unfollowUser(userId: number): Promise<void> {
    return apiFetch<void>(`/users/${userId}/follow`, { method: 'DELETE' });
}

export function getFollowers(userId: number, limit: number, offset: number): Promise<ApiRelationListResult> {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
    return apiFetch<ApiRelationListResult>(`/users/${userId}/followers?${params.toString()}`);
}

export function getFollowing(userId: number, limit: number, offset: number): Promise<ApiRelationListResult> {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
    return apiFetch<ApiRelationListResult>(`/users/${userId}/following?${params.toString()}`);
}

export interface UpdateCurrentUserPayload {
    username?: string;
    display?: string;
    bio?: string | null;
    pronoun?: string | null;
    current_password?: string;
    password?: string;
    links?: ApiLink[] | null;
    tags?: string[] | null;
    home?: string | null;
    avatar?: string | null;
    presence?: string;
    presence_status?: string | null;
}

export async function updateCurrentUser(data: UpdateCurrentUserPayload): Promise<ApiCurrentUser> {
    const user = await apiFetch<ApiCurrentUser>('/users/@me', { method: 'POST', body: JSON.stringify(data) });
    dispatchCurrentUserReplace(user);
    return user;
}

export interface VerificationMethod {
    type: string;
    name: string;
    description: string;
    enabled: boolean;
    details: {
        sendable: boolean;
        data: Record<string, unknown>;
        code: {
            length: number;
            type: 'numeric' | 'alphanumeric' | 'hex';
        } | null;
        cooldown: number | null;
    } | null;
}

export async function uploadUserThumbnail(file: Blob): Promise<void> {
    const form = new FormData();
    form.append('file', file, 'thumbnail');
    const res = await apiFetchRaw('/users/@me/thumbnail', { method: 'POST', body: form });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
}

export async function uploadUserBanner(file: Blob): Promise<void> {
    const form = new FormData();
    form.append('file', file, 'banner');
    const res = await apiFetchRaw('/users/@me/banner', { method: 'POST', body: form });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
}


/**
 * Batch-fetch users by NoxIdentifier strings (e.g. "1@example.com").
 * Deduplicates identifiers and strips the local server suffix so the API
 * receives compact IDs (e.g. "1" instead of "1@hactazia.fr").
 * Only local users are returned; external identifiers are passed as-is.
 */
export function batchGetUsers(ids: string[]): Promise<ApiUserSearchResult> {
    const localServer = getWellKnownAddress();
    const seen = new Set<string>();
    const params = new URLSearchParams();
    for (const raw of ids) {
        if (!raw) continue;
        // Normalize: strip local server suffix to get compact ID
        let key = raw;
        if (localServer) {
            const suffix = `@${localServer}`;
            if (raw.endsWith(suffix)) key = raw.slice(0, raw.length - suffix.length);
        }
        if (seen.has(key)) continue;
        seen.add(key);
        params.append('id', key);
    }
    params.set('limit', String(Math.min(seen.size, 100)));
    return apiFetch<ApiUserSearchResult>(`/users?${params.toString()}`);
}

export function listUserPublic(userId: string | number): Promise<ApiPublicTableList> {
    return apiFetch<ApiPublicTableList>(`/users/${userId}/public`);
}

export async function getUserPublicEntry<T>(userId: string | number, entryKey: string): Promise<T> {
    const res = await apiFetchRaw(`/users/${userId}/public/${entryKey}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<T>;
}
