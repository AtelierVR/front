import { apiFetch } from './client';
import type { ApiRelay, ApiRelayLog, ApiRelayInstance, ApiRelayClient, ApiRelayAssignedInstance } from '@/types/api';

export function listRelays(): Promise<ApiRelay[]> {
    return apiFetch<ApiRelay[]>('/relays');
}

export function getRelay(id: number): Promise<ApiRelay> {
    return apiFetch<ApiRelay>(`/relays/${id}`);
}

export function getRelayLogs(id: number, since?: number, limit = 100): Promise<ApiRelayLog[]> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (since !== undefined) params.set('since', String(since));
    return apiFetch<ApiRelayLog[]>(`/relays/${id}/logs?${params}`);
}

export function getRelayLiveInstances(id: number, limit = 100, offset = 0): Promise<{ total: number; limit: number; offset: number; items: ApiRelayInstance[] }> {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    return apiFetch<{ total: number; limit: number; offset: number; items: ApiRelayInstance[] }>(`/relays/${id}/live?${params}`);
}

export function getRelayClients(id: number, limit = 100, offset = 0): Promise<{ total: number; limit: number; offset: number; items: ApiRelayClient[] }> {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    return apiFetch<{ total: number; limit: number; offset: number; items: ApiRelayClient[] }>(`/relays/${id}/clients?${params}`);
}

export function getRelayInstances(id: number): Promise<{ total: number; items: ApiRelayAssignedInstance[] }> {
    return apiFetch<{ total: number; items: ApiRelayAssignedInstance[] }>(`/relays/${id}/instances`);
}

export function getRelayInstance(relayId: number, iid: string | number): Promise<import('@/types/api').ApiInstance> {
    return apiFetch<import('@/types/api').ApiInstance>(`/relays/${relayId}/instances/${iid}`);
}

export function getRelayInstancePlayers(relayId: number, iid: string | number): Promise<{ total: number; items: import('@/types/api').ApiRelayPlayer[] }> {
    return apiFetch<{ total: number; items: import('@/types/api').ApiRelayPlayer[] }>(`/relays/${relayId}/instances/${iid}/players`);
}

export function sendRelayCommand(id: number, content: string): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>(`/relays/${id}/command`, {
        method: 'POST',
        body: JSON.stringify({ content }),
    });
}

export function startRelay(id: number, maxInstances?: number): Promise<{ success: boolean; provider_id: string }> {
    const params = maxInstances !== undefined ? `?max_instances=${maxInstances}` : '';
    return apiFetch<{ success: boolean; provider_id: string }>(`/relays/${id}/start${params}`, { method: 'POST' });
}

export function stopRelay(id: number): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>(`/relays/${id}/stop`, { method: 'POST' });
}

export function restartRelay(id: number): Promise<{ success: boolean; provider_id: string }> {
    return apiFetch<{ success: boolean; provider_id: string }>(`/relays/${id}/restart`, { method: 'POST' });
}
