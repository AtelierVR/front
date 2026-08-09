import { apiFetch } from './client';

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface IRSession {
    id: string;
    current: boolean;
    active: boolean;
    public_key: string | null;
    expires_at: number;
    created_at: number;
    devices: IRDevice[];
}

export interface IRDevice {
    user_agent: string;
    ip: string;
    last_seen: number;
}

export interface SessionsListResponse {
    sessions: IRSession[];
    total: number;
    limit: number;
    offset: number;
}

export interface SessionDeleteResponse {
    success: boolean;
    logout: boolean;
}

// ── API functions ─────────────────────────────────────────────────────────────

/** GET /users/@me/sessions — list all user sessions (paginated, optional IP filter) */
export async function listMySessions(limit = 10, offset = 0, ip?: string): Promise<SessionsListResponse> {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (ip) params.set('ip', ip);
    return apiFetch<SessionsListResponse>(`/users/@me/sessions?${params}`);
}

/** GET /users/@me/session — get current session */
export async function fetchCurrentSession(): Promise<IRSession> {
    return apiFetch<IRSession>('/users/@me/session');
}

/** DELETE /users/@me/sessions/:id — delete a specific session */
export async function deleteMySession(id: string): Promise<SessionDeleteResponse> {
    return apiFetch<SessionDeleteResponse>(`/users/@me/sessions/${id}`, { method: 'DELETE' });
}

/** DELETE /users/@me/sessions — delete all sessions (except current, unless logout) */
export async function deleteAllMySessions(): Promise<SessionDeleteResponse> {
    return apiFetch<SessionDeleteResponse>('/users/@me/sessions', { method: 'DELETE' });
}
