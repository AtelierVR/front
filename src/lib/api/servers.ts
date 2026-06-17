import { apiFetch } from './client';
import type { ApiServer, ApiServerDetail } from '@/types/api';
import { resolveLocalized } from '@/lib/i18n/resolveLocalized';

export function listServers(limit?: number, offset?: number): Promise<ApiServer[]> {
    const params = new URLSearchParams();
    if (limit !== undefined) params.set('limit', String(limit));
    if (offset !== undefined) params.set('offset', String(offset));
    const qs = params.toString();
    return apiFetch<ApiServer[]>(`/servers${qs ? '?' + qs : ''}`);
}

function serverSearchText(s: ApiServer, locale: string): string {
    const parts = [s.address];
    const wm = s.wellknown?.metadata;
    if (wm) {
        const title = resolveLocalized(wm.title, locale);
        if (title) parts.push(title);
        const desc = resolveLocalized(wm.description, locale);
        if (desc) parts.push(desc);
    }
    return parts.join(' ').toLowerCase();
}

export async function searchServers(query: string, limit: number, offset: number, locale?: string): Promise<{ total: number; limit: number; offset: number; items: ApiServer[] }> {
    const all = await listServers(200, 0);
    const lang = locale ?? 'en';
    const q = query.trim().toLowerCase();
    const filtered = q
        ? all.filter((s) => serverSearchText(s, lang).includes(q))
        : all;
    return {
        total: filtered.length,
        limit,
        offset,
        items: filtered.slice(offset, offset + limit),
    };
}

export function getServer(address: string): Promise<ApiServerDetail> {
    return apiFetch<ApiServerDetail>(`/servers/${address}`);
}

export function getServerDetails(address: string): Promise<Record<string, boolean>> {
    return apiFetch<Record<string, boolean>>(`/servers/${address}/configs`);
}
