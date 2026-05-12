import { apiFetch } from './client';
import type { ApiSession } from '@/types/api';

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
