import { apiFetch, apiFetchRaw, dispatchCurrentUserReplace } from './client';
import { idParam } from './utils';
import { parseNoxId } from '@/types/nox-identifier';
import type { ApiUser, ApiCurrentUser, ApiLink, ApiUserSearchResult, ApiPublicTableList, ApiRelationListResult, ApiBiRelationListResult } from '@/types/api';
import type { ApiErrorDetails } from '@/types/envelope';
import { ApiError } from '@/types/envelope';

export function getUser(username: string): Promise<ApiUser> {
    return apiFetch<ApiUser>(`/users/${idParam(username)}`);
}

export function searchUsers(query: string, limit: number, offset: number): Promise<ApiUserSearchResult> {
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query);
    params.set('limit', limit.toString());
    params.set('offset', offset.toString());
    return apiFetch<ApiUserSearchResult>(`/users?${params.toString()}`);
}

export function followUser(userId: number | string): Promise<{ type: string }> {
    return apiFetch<{ type: string }>(`/users/${idParam(userId)}/follow`, { method: 'POST' });
}

export function unfollowUser(userId: number | string): Promise<void> {
    return apiFetch<void>(`/users/${idParam(userId)}/follow`, { method: 'DELETE' });
}

export function getFollowers(userId: string | number, limit: number, offset: number): Promise<ApiRelationListResult> {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
    return apiFetch<ApiRelationListResult>(`/users/${idParam(userId)}/followers?${params.toString()}`);
}

export function getFollowing(userId: string | number, limit: number, offset: number): Promise<ApiRelationListResult> {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
    return apiFetch<ApiRelationListResult>(`/users/${idParam(userId)}/following?${params.toString()}`);
}

export function getFriends(userId: number, limit: number, offset: number): Promise<ApiBiRelationListResult> {
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
    return apiFetch<ApiBiRelationListResult>(`/users/@me/friends?${params.toString()}`);
}

export function respondToRequest(initiatorRef: string, accept: boolean): Promise<void> {
    const params = new URLSearchParams({ accept: accept.toString() });
    return apiFetch<void>(`/users/@me/follow/${idParam(initiatorRef)}/respond?${params.toString()}`, { method: 'POST' });
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

// Canonical definition lives in `@/types/verification`; re-exported for compatibility.
export type { VerificationMethod } from '@/types/verification';

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

export function listUserPublic(userId: string | number, filter?: string): Promise<ApiPublicTableList> {
    const qs = filter ? `?${new URLSearchParams({ filter }).toString()}` : '';
    return apiFetch<ApiPublicTableList>(`/users/${idParam(userId)}/public${qs}`);
}

/**
 * In-flight deduplication for public entries.
 *
 * `apiFetchRaw` responses can only be read once, so the parsed JSON is shared
 * between concurrent callers instead of the raw Response.
 */
const _publicEntryInflight = new Map<string, Promise<unknown>>();

export function getUserPublicEntry<T>(userId: string | number, entryKey: string): Promise<T> {
    const id = idParam(userId);
    const key = `${id}/${entryKey}`;
    const inflight = _publicEntryInflight.get(key) as Promise<T> | undefined;
    if (inflight) return inflight;

    const promise = (async (): Promise<T> => {
        const res = await apiFetchRaw(`/users/${id}/public/${entryKey}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<T>;
    })().finally(() => { _publicEntryInflight.delete(key); });

    _publicEntryInflight.set(key, promise);
    return promise;
}
