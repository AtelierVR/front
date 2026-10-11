import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import type { AuthenticationResponseJSON, PublicKeyCredentialCreationOptionsJSON, PublicKeyCredentialRequestOptionsJSON, RegistrationResponseJSON } from '@simplewebauthn/browser';
import { apiFetch } from './client';
import type { ApiSession } from '@/types/api';

/**
 * Passkey (WebAuthn) API.
 *
 * Every ceremony is two round-trips: fetch the challenge, let the authenticator
 * sign it, then post the signed response back. The server keeps the challenge
 * behind an opaque `ceremony_id` so the client holds no ceremony state.
 */

export interface Passkey {
    id: string;
    name: string | null;
    device_type: string;
    backed_up: boolean;
    discoverable: boolean;
    transports: string[];
    created_at: number;
    last_used_at: number | null;
}

interface OptionsEnvelope<O> {
    ceremony_id: string;
    options: O;
}

/** True when the browser can run WebAuthn ceremonies at all. */
export function passkeysSupported(): boolean {
    return typeof window !== 'undefined'
        && typeof window.PublicKeyCredential !== 'undefined'
        && !!navigator.credentials;
}

// ── Management ──────────────────────────────────────────────────────────────

export function listPasskeys(): Promise<Passkey[]> {
    return apiFetch<Passkey[]>('/auth/passkey');
}

/**
 * Removes a passkey. This is security-sensitive, so the API answers with
 * `VERIFICATION_REQUIRED`; the global interceptor pops the verification modal
 * and replays this same request with a `factor_code`.
 */
export function deletePasskey(id: string): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>(`/auth/passkey/${id}`, { method: 'DELETE' });
}

export function renamePasskey(id: string, name: string | null): Promise<Passkey> {
    return apiFetch<Passkey>(`/auth/passkey/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name }),
    });
}

// ── Registration ────────────────────────────────────────────────────────────

/** Runs the full registration ceremony and returns the created passkey. */
export async function registerPasskey(name?: string): Promise<Passkey> {
    const { ceremony_id, options } = await apiFetch<OptionsEnvelope<PublicKeyCredentialCreationOptionsJSON>>(
        '/auth/passkey/register/options',
        { method: 'POST' },
    );

    const response: RegistrationResponseJSON = await startRegistration({ optionsJSON: options });

    const result = await apiFetch<{ verified: boolean; passkey: Passkey }>(
        '/auth/passkey/register/verify',
        { method: 'POST', body: JSON.stringify({ ceremony_id, name, response }) },
    );

    return result.passkey;
}

// ── Authentication ──────────────────────────────────────────────────────────

/**
 * Signs in with a passkey.
 *
 * With an `identifier` the ceremony is bound to that account (used as a second
 * factor after a password check); without one the browser offers any discoverable
 * passkey, which makes it a full passwordless login.
 */
export async function loginWithPasskey(identifier?: string): Promise<ApiSession> {
    const { ceremony_id, options } = await apiFetch<OptionsEnvelope<PublicKeyCredentialRequestOptionsJSON>>(
        '/auth/passkey/login/options',
        { method: 'POST', body: JSON.stringify(identifier ? { identifier } : {}) },
    );

    const response: AuthenticationResponseJSON = await startAuthentication({ optionsJSON: options });

    return apiFetch<ApiSession>('/auth/passkey/login/verify', {
        method: 'POST',
        body: JSON.stringify({ ceremony_id, response }),
    });
}

/** The user dismissed the passkey prompt — not an error worth surfacing. */
export function isPasskeyCancelled(err: unknown): boolean {
    const name = (err as { name?: string } | null)?.name ?? '';
    return name === 'NotAllowedError' || name === 'AbortError' || name === 'NotSupportedError';
}

// ── Second factor ───────────────────────────────────────────────────────────

/**
 * Proves a passkey assertion and returns a single-use 6-digit code to send as
 * `factor_code` on the request that required verification.
 */
export async function requestPasskeyFactorCode(identifier?: string): Promise<string> {
    const { ceremony_id, options } = await apiFetch<OptionsEnvelope<PublicKeyCredentialRequestOptionsJSON>>(
        '/auth/passkey/login/options',
        { method: 'POST', body: JSON.stringify(identifier ? { identifier } : {}) },
    );

    const response: AuthenticationResponseJSON = await startAuthentication({ optionsJSON: options });

    const result = await apiFetch<{ factor_code: string }>('/auth/passkey/verify', {
        method: 'POST',
        body: JSON.stringify({ ceremony_id, response }),
    });

    return result.factor_code;
}
