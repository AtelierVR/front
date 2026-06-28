import { apiFetch, apiFetchRaw } from './client';

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface TableMeta {
    key: string;
    mime: string;
    hash: string;
    created_at: number;
    updated_at: number;
}

export interface TableListResponse {
    items: TableMeta[];
    total: number;
}

export interface FavoriteEntry {
    values: string[];
    label?: string;
}

export interface FavoriteTableData {
    data: FavoriteEntry;
    mime: string;
}

export interface TableDownloadResult {
    /** Raw binary content */
    buf: ArrayBuffer;
    /** MIME type from the server */
    mime: string;
    /** Content-Length in bytes */
    size: number;
    /** Suggested filename (from Content-Disposition header) */
    filename: string;
    /** Creation date from the Date header, or null if unavailable */
    created: Date | null;
    /** Last-modified date from the Last-Modified header, or null if unavailable */
    modified: Date | null;
}

// ── API functions ─────────────────────────────────────────────────────────────

/** GET /users/@me/tables/:key — returns parsed JSON or null */
export async function getMyTable(key: string): Promise<FavoriteTableData | null> {
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

/** GET /users/@me/tables — returns metadata list with total */
export async function listMyTables(limit = 100, offset = 0, filter?: string): Promise<TableListResponse> {
    try {
        const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
        if (filter) params.set('filter', filter);
        const res = await apiFetch<TableListResponse>(`/users/@me/tables?${params}`);
        return { items: res.items ?? [], total: res.total ?? 0 };
    } catch {
        return { items: [], total: 0 };
    }
}

/** DELETE /users/@me/tables/:key */
export async function deleteMyTable(key: string): Promise<boolean> {
    try {
        await apiFetch(`/users/@me/tables/${key}`, { method: 'DELETE' });
        return true;
    } catch {
        return false;
    }
}

/** GET /users/@me/tables/:key — returns raw binary + metadata for download */
export async function downloadMyTable(key: string): Promise<TableDownloadResult | null> {
    try {
        const res = await apiFetchRaw(`/users/@me/tables/${key}`);
        if (!res.ok) return null;

        const mime = res.headers.get('content-type') ?? 'application/octet-stream';
        const buf = await res.arrayBuffer();
        const size = parseInt(res.headers.get('content-length') ?? '0', 10) || buf.byteLength;

        // Extract filename from Content-Disposition
        const disposition = res.headers.get('content-disposition') ?? '';
        const filenameMatch = disposition.match(/filename="([^"]+)"/);
        const filename = filenameMatch?.[1] ?? key;

        // Parse server-sent timestamps
        const created = parseHeaderDate(res.headers.get('date'));
        const modified = parseHeaderDate(res.headers.get('last-modified'));

        return { buf, mime, size, filename, created, modified };
    } catch {
        return null;
    }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function parseHeaderDate(value: string | null): Date | null {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
}
