import { apiFetch } from './client';
import type { ApiServer, ApiServerDetail } from '@/types/api';

export function listServers(): Promise<ApiServer[]> {
    return apiFetch<ApiServer[]>('/servers');
}

export async function searchServers(query: string, limit: number, offset: number): Promise<{ total: number; limit: number; offset: number; items: ApiServer[] }> {
    const all = await listServers();
    const q = query.trim().toLowerCase();
    const filtered = q ? all.filter((s) => s.address.toLowerCase().includes(q)) : all;
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
