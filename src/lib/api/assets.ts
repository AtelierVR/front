import { apiFetch } from './client';
import { idParam } from './utils';
import type { InstanceConfig } from './configs';
import type { ApiAsset, ApiConfigAsset, ApiSearchResult } from '@/types/api';

/**
 * Asset kinds served by the instance.
 *
 * `GET /configs` publishes them under `assets` — payload `type`, Nox identifier
 * `key`, route `endpoint`, and the upload `rules` enforced on their files — so
 * the front never hardcodes that mapping: an instance serving other kinds, or
 * other sets of kinds, works without a code change.
 */

/** Asset kinds of the instance, in the order the node declares them. */
export function instanceAssets(
    config: InstanceConfig | null | undefined,
): ApiConfigAsset[] {
    return config?.assets ?? [];
}

/** Declaration of an asset kind, looked up by its payload `type`. */
export function assetByType(
    config: InstanceConfig | null | undefined,
    type: string | null | undefined,
): ApiConfigAsset | null {
    const wanted = type?.trim().toLocaleLowerCase();
    if (!wanted) return null;
    return (
        instanceAssets(config).find(
            (asset) => asset.type.toLocaleLowerCase() === wanted,
        ) ?? null
    );
}

/** Declaration of an asset kind, looked up by its route `endpoint`. */
export function assetByEndpoint(
    config: InstanceConfig | null | undefined,
    endpoint: string | null | undefined,
): ApiConfigAsset | null {
    const wanted = endpoint?.trim().toLocaleLowerCase();
    if (!wanted) return null;
    return (
        instanceAssets(config).find(
            (asset) => asset.endpoint.toLocaleLowerCase() === wanted,
        ) ?? null
    );
}

/**
 * Endpoint serving an asset (`avatar` → `avatars`), or `null` when the instance
 * does not serve its kind.
 */
export function assetEndpoint(
    config: InstanceConfig | null | undefined,
    asset: ApiAsset | null | undefined,
): string | null {
    return asset ? (assetByType(config, asset.type)?.endpoint ?? null) : null;
}

/**
 * Nox identifier key of an asset (`avatar` → `a`), used by the asset routes
 * (`/a/<id>`), or `null` when the instance does not serve its kind.
 */
export function assetKey(
    config: InstanceConfig | null | undefined,
    asset: ApiAsset | null | undefined,
): string | null {
    return asset ? (assetByType(config, asset.type)?.key ?? null) : null;
}

/** Any asset by endpoint — every asset payload shares {@link ApiAsset}. */
export function getAsset(
    endpoint: string,
    id: number | string,
): Promise<ApiAsset> {
    return apiFetch<ApiAsset>(`/${endpoint}/${idParam(id)}`);
}

/** Searches an asset endpoint (`GET /{endpoint}?query=&limit=&offset=`). */
export function searchAssets(
    endpoint: string,
    query: string,
    limit: number,
    offset: number,
): Promise<ApiSearchResult<ApiAsset>> {
    const params = new URLSearchParams();
    if (query.trim()) params.set('query', query);
    params.set('limit', limit.toString());
    params.set('offset', offset.toString());
    return apiFetch<ApiSearchResult<ApiAsset>>(`/${endpoint}?${params.toString()}`);
}
