import { apiFetch, apiFetchRaw } from './client';

export interface TableMeta {
    key: string;
    mime: string;
    hash: string;
    created_at: number;
    updated_at: number;
}

export interface FavoriteEntry {
    values: string[];
    label?: string;
}

/** GET /users/@me/tables/:key — returns parsed JSON or null */
export async function getMyTable(key: string): Promise<{ data: FavoriteEntry; mime: string } | null> {
    try {
        const res = await apiFetchRaw(`/users/@me/tables/${key}`);
        if (!res.ok) return null;
        const mime = res.headers.get('content-type') ?? 'application/octet-stream';
        const text = await res.text();
        return { data: JSON.parse(text) as FavoriteEntry, mime };
    } catch {
        return null;
    }
}

/** POST /users/@me/tables/:key — stores JSON with given mime type */
export async function setMyTable(key: string, value: FavoriteEntry, mime: string): Promise<boolean> {
    try {
        const res = await apiFetchRaw(`/users/@me/tables/${key}`, {
            method: 'POST',
            body: JSON.stringify(value),
            headers: { 'Content-Type': mime },
        });
        return res.ok;
    } catch {
        return false;
    }
}

/** GET /users/@me/tables — returns metadata list */
export async function listMyTables(limit = 100, offset = 0, filter?: string): Promise<TableMeta[]> {
    try {
        const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
        if (filter) params.set('filter', filter);
        const res = await apiFetch<{ items: TableMeta[]; total: number }>(`/users/@me/tables?${params}`);
        return (res as { items: TableMeta[] }).items ?? [];
    } catch {
        return [];
    }
}
