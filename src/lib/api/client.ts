import { ApiError, type ApiResponse } from '@/types/envelope';
import { getToken, clearToken } from '@/lib/auth/storage';
import type { ApiCurrentUser, ApiUser } from '@/types/api';

export type LogoutDispatch = () => void;

let _logoutDispatch: LogoutDispatch | null = null;
let _gatewayUrl: string | null = null;

/** Registered by ApiProvider — called to fully replace currentUser (e.g. from WS hello). */
let _currentUserReplace: ((user: ApiCurrentUser) => void) | null = null;
/** Registered by ApiProvider — called to shallowly merge ApiUser fields into currentUser. */
let _currentUserMerge: ((user: ApiUser) => void) | null = null;

/** Register the logout callback so apiFetch can trigger it on 401. */
export function registerLogoutDispatch(fn: LogoutDispatch): void {
  _logoutDispatch = fn;
}

/** Register the gateway API base URL (from wk.gateway.api). Must be called before apiFetch. */
export function registerGatewayUrl(url: string): void {
  _gatewayUrl = url.replace(/\/$/, '');
}

/** Replace currentUser in ApiProvider (used after a WS `hello` frame). */
export function registerCurrentUserReplace(fn: (user: ApiCurrentUser) => void): void {
  _currentUserReplace = fn;
}
export function dispatchCurrentUserReplace(user: ApiCurrentUser): void {
  _currentUserReplace?.(user);
}

/**
 * Merge ApiUser fields into currentUser in ApiProvider.
 * Preserves ApiCurrentUser-only fields (email, twofa_enabled, etc.).
 */
export function registerCurrentUserMerge(fn: (user: ApiUser) => void): void {
  _currentUserMerge = fn;
}
export function dispatchCurrentUserMerge(user: ApiUser): void {
  _currentUserMerge?.(user);
}

/**
 * Typed fetch wrapper.
 * - Uses the gateway.api base URL registered via registerGatewayUrl()
 * - path should NOT include /api/ prefix (gateway.api already contains it)
 * - Injects Authorization header from localStorage token
 * - Unwraps the ApiResponse<T> envelope
 * - Throws ApiError on non-2xx or envelope error
 * - Dispatches logout on 401
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (!_gatewayUrl) {
    throw new Error('apiFetch: gateway URL not registered. Call registerGatewayUrl() first.');
  }

  const token = getToken();
  const headers = new Headers(options.headers ?? {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const url = `${_gatewayUrl}${path}`;
  const res = await fetch(url, { ...options, headers });

  // Handle 401 — session expired
  if (res.status === 401) {
    clearToken();
    _logoutDispatch?.();
    const envelope: ApiResponse<T> = await res.json().catch(() => ({
      data: null,
      error: { code: 'UNAUTHORIZED', message: 'Session expired.', status: 401 },
      time: Date.now(),
      request: path,
    }));
    throw new ApiError(
      (envelope as { error: ConstructorParameters<typeof ApiError>[0] }).error,
    );
  }

  const envelope: ApiResponse<T> = await res.json();

  if (envelope.error) 
    throw new ApiError(envelope.error);

  return (envelope as { data: T }).data;
}

/**
 * Raw fetch — same auth injection as apiFetch, but returns the Response directly
 * without envelope unwrapping. Use for endpoints that return non-envelope bodies
 * (e.g. /users/:id/public/:type which streams raw content).
 */
export async function apiFetchRaw(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  if (!_gatewayUrl) {
    throw new Error('apiFetchRaw: gateway URL not registered.');
  }
  const token = getToken();
  const headers = new Headers(options.headers ?? {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(`${_gatewayUrl}${path}`, { ...options, headers });
}
