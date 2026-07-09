import { apiFetch } from './client';
import type { ApiSession } from '@/types/api';

// ── Login / Register ─────────────────────────────────────────────────────────

export interface LoginPayload {
    identifier: string;
    password: string;
    factor_code?: string;
}

export interface RegisterPayload {
    username: string;
    password: string;
    display?: string;
    email?: string;
}

export function login(payload: LoginPayload): Promise<ApiSession> {
    return apiFetch<ApiSession>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export function register(payload: RegisterPayload): Promise<ApiSession> {
    return apiFetch<ApiSession>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

// ── TOTP ─────────────────────────────────────────────────────────────────────

export interface TotpSetupResult {
    secret: string;
    qr_code_url: string;
    backup_codes: string[];
}

export interface TotpEnableResult {
    enabled: boolean;
    message: string;
}

export interface TotpDisableResult {
    disabled: boolean;
    message: string;
}

export async function setupTotp(): Promise<TotpSetupResult> {
    return apiFetch<TotpSetupResult>('/auth/methods/totp/setup', { method: 'POST' });
}

export async function enableTotp(secret: string, token: string): Promise<TotpEnableResult> {
    return apiFetch<TotpEnableResult>('/auth/methods/totp/enable', {
        method: 'POST',
        body: JSON.stringify({ secret, token }),
    });
}

export async function disableTotp(): Promise<TotpDisableResult> {
    return apiFetch<TotpDisableResult>('/auth/methods/totp/disable', { method: 'POST' });
}

// ── Email ───────────────────────────────────────────────────────────────────

export async function setupEmail(email: string): Promise<MethodAction> {
    return apiFetch<MethodAction>('/auth/methods/email/setup', {
        method: 'POST',
        body: JSON.stringify({ email }),
    });
}

export async function verifyEmailCode(token: string): Promise<MethodAction> {
    return apiFetch<MethodAction>('/auth/methods/email/enable', {
        method: 'POST',
        body: JSON.stringify({ token }),
    });
}

export async function removeEmail(): Promise<MethodAction> {
    return apiFetch<MethodAction>('/auth/methods/email/disable', { method: 'POST' });
}

export interface MethodAction {
    enabled?: boolean;
    disabled?: boolean;
    message: string;
}

// ── Verification (2FA challenge) ─────────────────────────────────────────────

export interface VerificationMethod {
    type: string;
    name: string;
    description: string;
    enabled: boolean;
    details: {
        sendable: boolean;
        data: Record<string, unknown>;
        code: {
            length: number;
            type: 'numeric' | 'alphanumeric' | 'hex';
        } | null;
        cooldown: number | null;
    } | null;
}

export async function sendVerificationCode(type: string, data: Record<string, unknown>): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>(`/auth/methods/${encodeURIComponent(type)}/send`, {
        method: 'POST',
        body: JSON.stringify({ type, ...data }),
    });
}
