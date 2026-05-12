'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState, useCallback, useRef } from 'react';
import { LogsViewer } from '@/components/logs-viewer';
import { getRelayLogs, sendRelayCommand } from '@/lib/api';
import { useWsEvent } from '@/lib/ws/context';
import type { ApiRelayLog } from '@/types/api';

export default function RelayLogsPage() {
    const params = useParams<{ id: string }>();
    const relayId = parseInt(params.id, 10);

    const [logs, setLogs] = useState<ApiRelayLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | undefined>();
    const loadedRef = useRef(false);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        setError(undefined);
        try {
            const res = await getRelayLogs(relayId, undefined, 100);
            setLogs(res ?? []);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load logs');
        } finally {
            setLoading(false);
        }
    }, [relayId]);

    useEffect(() => {
        if (loadedRef.current) return;
        loadedRef.current = true;
        fetchLogs();
    }, [fetchLogs]);

    useWsEvent('relay_logs', (payload: unknown) => {
        const data = payload as { relay_id: number; time: number; level: string; message: string; tag?: string | null };
        if (data.relay_id === relayId) {
            setLogs(prev => [...prev, {
                timestamp: data.time,
                level: data.level,
                message: data.message,
                tag: data.tag ?? null,
            }]);
        }
    });

    const handleInput = useCallback(async (content: string) => {
        try {
            await sendRelayCommand(relayId, content);
        } catch { /* ignore */ }
    }, [relayId]);

    return (
        <div className="flex flex-1 flex-col">
            <LogsViewer
                logs={logs}
                loading={loading}
                error={error}
                liveMode
                onRefresh={fetchLogs}
                isInputable
                onInput={handleInput}
            />
        </div>
    );
}
