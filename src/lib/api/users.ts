import { apiFetch, apiFetchRaw, dispatchCurrentUserReplace } from './client';
import { parseNoxId } from '@/types/nox-identifier';
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

export function followUser(userId: number | string): Promise<{ type: string }> {
    const id = typeof userId === 'string' ? userId : userId;
    return apiFetch<{ type: string }>(`/users/${id}/follow`, { method: 'POST' });
}

export function unfollowUser(userId: number | string): Promise<void> {
    const id = typeof userId === 'string' ? userId : userId;
    return apiFetch<void>(`/users/${id}/follow`, { method: 'DELETE' });
}

export function getFollowers(userId: string | number, limit: number, offset: number): Promise<ApiRelationListResult> {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
    return apiFetch<ApiRelationListResult>(`/users/${userId}/followers?${params.toString()}`);
}

export function getFollowing(userId: string | number, limit: number, offset: number): Promise<ApiRelationListResult> {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
    return apiFetch<ApiRelationListResult>(`/users/${userId}/following?${params.toString()}`);
}

export function getFriends(userId: number, limit: number, offset: number): Promise<{ total: number; refs: string[] }> {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
    return apiFetch<{ total: number; refs: string[] }>(`/users/@me/friends?${params.toString()}`);
}

export function respondToRequest(initiatorRef: string, accept: boolean): Promise<void> {
    const params = new URLSearchParams({ accept: accept.toString() });
    return apiFetch<void>(`/users/@me/follow/${initiatorRef}/respond?${params.toString()}`, { method: 'POST' });
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
 * Groups by the key part (before @) for deduplication.
 * Sends compact IDs (key only) to the local API — the backend resolves
 * local users regardless of which alias domain was used in the ref.
 */
export function batchGetUsers(ids: string[]): Promise<ApiUserSearchResult> {
    const seen = new Set<string>();
    const params = new URLSearchParams();
    for (const raw of ids) {
        if (!raw) continue;
        const parsed = parseNoxId(raw);
        if (seen.has(parsed.id)) continue;
        seen.add(parsed.id);
        params.append('id', parsed.id);
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
