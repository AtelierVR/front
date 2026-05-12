'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { SiteHeader } from '@/components/site-header';
import { LogsViewer } from '@/components/logs-viewer';
import { getServerLogs, useApi } from '@/lib/api';
import { useWsEvent } from '@/lib/ws/context';
import type { ApiLogEntry } from '@/types/api';
import { useTranslation } from 'react-i18next';
import { NotFound } from '@/app/(dashboard)/not-found';

export default function LogsPage() {
    const { isAdmin, isLoading } = useApi();
    if (isLoading) return null;
    const { t } = useTranslation();
    if (!isAdmin) return <NotFound
        children={t('admin.logs')}
    />;




    const [logs, setLogs] = useState<ApiLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | undefined>();
    const loadedRef = useRef(false);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        setError(undefined);
        try {
            const res = await getServerLogs(500);
            setLogs(res.items);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load logs');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (loadedRef.current) return;
        loadedRef.current = true;
        fetchLogs();
    }, [fetchLogs]);

    useWsEvent('server_logs', (payload: unknown) => {
        const data = payload as ApiLogEntry;
        setLogs(prev => [...prev, data]);
    });

    return (
        <>
            <SiteHeader children={t('admin.logs')} />
            <div className="flex flex-1 flex-col p-4 md:p-6 gap-4">
                <LogsViewer
                    logs={logs}
                    loading={loading}
                    error={error}
                    liveMode
                    onRefresh={fetchLogs}
                    className="flex-1"
                />
            </div>
        </>
    );
}
