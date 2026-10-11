import { apiFetch } from './client';
import { idParam } from './utils';
import type { ApiMod, ApiModList } from '@/types/api';

export function getMod(id: number | string): Promise<ApiMod> {
    return apiFetch<ApiMod>(`/mods/${idParam(id)}`);
}

export function searchMods(query: string, limit: number, offset: number): Promise<ApiModList> {
    const params = new URLSearchParams();
    if (query.trim()) params.set('query', query);
    params.set('limit', limit.toString());
    params.set('offset', offset.toString());
    return apiFetch<ApiModList>(`/mods?${params.toString()}`);
}
