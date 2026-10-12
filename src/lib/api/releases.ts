import { apiFetch } from './client';
import { idParam } from './utils';
import type {
    ApiReleaseFileList,
    ApiReleaseList,
} from '@/types/api';

/**
 * Release endpoints, shared by every asset kind (`/mods`, `/worlds`,
 * `/avatars`): the payload shapes are identical, only the path changes. The
 * endpoint is the one published by the instance config (`assets[].endpoint`).
 */

export interface ReleaseQuery {
    /** Cumulative status filter; `all` (default here) includes pending releases. */
    status?: string;
    limit?: number;
    offset?: number;
    query?: string;
}

function queryString(options: ReleaseQuery): string {
    const params = new URLSearchParams();
    params.set('status', options.status ?? 'all');
    params.set('limit', String(options.limit ?? 10));
    params.set('offset', String(options.offset ?? 0));
    if (options.query?.trim()) params.set('query', options.query);
    return params.toString();
}

/** Paginated releases of an asset, newest first. */
export function getReleases(
    endpoint: string,
    id: number | string,
    options: ReleaseQuery = {},
): Promise<ApiReleaseList> {
    return apiFetch<ApiReleaseList>(
        `/${endpoint}/${idParam(id)}/releases?${queryString(options)}`,
    );
}

/** Paginated files of one release; `releaseRef` is its id or its name. */
export function getReleaseFiles(
    endpoint: string,
    id: number | string,
    releaseRef: number | string,
    options: ReleaseQuery = {},
): Promise<ApiReleaseFileList> {
    return apiFetch<ApiReleaseFileList>(
        `/${endpoint}/${idParam(id)}/releases/${idParam(releaseRef)}/files?${queryString({ limit: 100, ...options })}`,
    );
}
