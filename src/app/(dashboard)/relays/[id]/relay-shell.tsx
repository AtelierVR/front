'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import { useRelayContext } from './relay-context';
import type { ApiRelay, ApiRelaySpecs } from '@/types/api';
import { formatDistanceToNow } from 'date-fns';

function relayStatusColor(relay: ApiRelay): string {
    if (!relay.connected) return 'bg-zinc-400';
    const s = relay.runner?.status;
    if (s === 'running') return 'bg-green-500';
    if (s === 'pending' || s === 'starting') return 'bg-yellow-400';
    return 'bg-zinc-400';
}


function formatBytes(bytes: number): string {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
}

/** Sampling interval in ms: average raw values and push one chart point. */
const SAMPLE_INTERVAL = 2000;

/** One data-point with a real timestamp so the chart is time-based. */
type HistoryPoint = { v: number; t: number };

/** Keep only points within the last 60 seconds. */
const TIME_WINDOW = 60_000;

function lastValue(arr: HistoryPoint[]): number | null {
    return arr.length > 0 ? arr[arr.length - 1].v : null;
}

function SpecCard({
    label, icon, iconColor, chartColor,
    primary, secondary, pct, history,
}: {
    label: string; icon: string; iconColor: string; chartColor: string;
    primary: string | null; secondary?: string | null; pct?: number | null;
    history: HistoryPoint[];
}) {
    // Stable 15s time window domain so the axis scrolls in real time.
    const now = Date.now();
    const xDomain: [number, number] = [now - TIME_WINDOW, now];

    return (
        <div className="relative overflow-hidden rounded-lg border border-border bg-accent/10 p-3 flex items-center gap-3">
            {/* Mini area chart background */}
            <div className="absolute inset-0 opacity-15 pointer-events-none">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={chartColor} stopOpacity={0.6} />
                                <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        {/* Time-based X-axis: points are positioned by real timestamp */}
                        <XAxis dataKey="t" type="number" domain={xDomain} hide />
                        {/* Fixed Y domain [0,100] so chart background reflects true proportions */}
                        <YAxis domain={[0, 100]} hide />
                        <Area
                            type="monotone" dataKey="v" stroke={chartColor} strokeWidth={2}
                            fill={`url(#grad-${label})`} isAnimationActive={false}
                            connectNulls={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            {/* Content */}
            <div className={cn('relative z-10 p-2 rounded-lg shrink-0', `bg-[${iconColor}]/10`)}>
                <Icon icon={icon} className="size-5" style={{ color: iconColor }} />
            </div>
            <div className="relative z-10 min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-medium leading-tight truncate">{primary ?? '—'}</p>
                {secondary && <p className="text-xs text-muted-foreground truncate">{secondary}</p>}
            </div>
            {pct !== null && pct !== undefined && (
                <div className="relative z-10 ml-auto shrink-0 text-xs font-mono text-muted-foreground">
                    {pct.toFixed(0)}%
                </div>
            )}
        </div>
    );
}

function SpecCards({ specs }: { specs: ApiRelaySpecs | null }) {
    const [cpuHistory,      setCpuHistory]      = useState<HistoryPoint[]>([]);
    const [memHistory,      setMemHistory]      = useState<HistoryPoint[]>([]);
    const [uploadHistory,   setUploadHistory]   = useState<HistoryPoint[]>([]);
    const [downloadHistory, setDownloadHistory] = useState<HistoryPoint[]>([]);

    // Displayed (smoothed) values — updated only on each sample flush.
    const [display, setDisplay] = useState<{
        cpu: number | null; mem: number | null;
        upload: number | null; download: number | null;
        memBytes: number; uploadBytes: number; downloadBytes: number;
        cores: number; memTotal: number; uploadBw: number; downloadBw: number;
    }>({
        cpu: null, mem: null, upload: null, download: null,
        memBytes: 0, uploadBytes: 0, downloadBytes: 0,
        cores: 1, memTotal: 1, uploadBw: 0, downloadBw: 0,
    });

    // Accumulators: collect raw values between sample flushes.
    const acc = useRef<{
        cpu: number[]; mem: number[];
        upload: number[]; download: number[];
        // keep the latest metadata
        cores: number; memTotal: number; uploadBw: number; downloadBw: number;
    }>({
        cpu: [], mem: [], upload: [], download: [],
        cores: 1, memTotal: 1, uploadBw: 0, downloadBw: 0,
    });

    // Feed raw values into the accumulator on every 500ms specs push — no state update.
    useEffect(() => {
        if (!specs) return;
        const cpuPct = Math.min(100, (specs.processor.used / Math.max(1, specs.processor.cores)) * 100);
        const memPct = specs.memory.total > 0 ? (specs.memory.used / specs.memory.total) * 100 : 0;
        const uploadPct   = specs.upload.bandwidth   > 0 ? (specs.upload.used   / specs.upload.bandwidth)   * 100 : 0;
        const downloadPct = specs.download.bandwidth > 0 ? (specs.download.used / specs.download.bandwidth) * 100 : 0;
        acc.current.cpu.push(cpuPct);
        acc.current.mem.push(memPct);
        acc.current.upload.push(uploadPct);
        acc.current.download.push(downloadPct);
        acc.current.cores      = specs.processor.cores;
        acc.current.memTotal   = specs.memory.total;
        acc.current.uploadBw   = specs.upload.bandwidth;
        acc.current.downloadBw = specs.download.bandwidth;
    }, [specs]);

    // Every SAMPLE_INTERVAL: average the accumulator, push one chart point, update display.
    useEffect(() => {
        const avg = (arr: number[]) =>
            arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

        const id = setInterval(() => {
            const a = acc.current;
            const cpuAvg      = avg(a.cpu);
            const memAvg      = avg(a.mem);
            const uploadAvg   = avg(a.upload);
            const downloadAvg = avg(a.download);

            // Clear accumulators.
            a.cpu = []; a.mem = []; a.upload = []; a.download = [];

            if (cpuAvg === null) return; // no data yet

            const now = Date.now();
            const cutoff = now - TIME_WINDOW;
            const trim = (arr: HistoryPoint[]) => arr.filter(p => p.t >= cutoff);

            setCpuHistory(      p => [...trim(p), { v: cpuAvg!,      t: now }]);
            setMemHistory(      p => [...trim(p), { v: memAvg!,      t: now }]);
            setUploadHistory(   p => [...trim(p), { v: uploadAvg!,   t: now }]);
            setDownloadHistory( p => [...trim(p), { v: downloadAvg!, t: now }]);

            setDisplay({
                cpu: cpuAvg, mem: memAvg,
                upload: uploadAvg, download: downloadAvg,
                memBytes: a.memTotal, uploadBytes: a.uploadBw, downloadBytes: a.downloadBw,
                cores: a.cores, memTotal: a.memTotal, uploadBw: a.uploadBw, downloadBw: a.downloadBw,
            });
        }, SAMPLE_INTERVAL);
        return () => clearInterval(id);
    }, []);

    return <>
        <SpecCard
            label="CPU"
            icon="material-symbols:memory-rounded"
            iconColor="#3b82f6"
            chartColor="#3b82f6"
            primary={display.cpu !== null ? `${display.cpu.toFixed(1)}%` : (() => { const v = lastValue(cpuHistory); return v !== null ? `${v.toFixed(1)}%` : null; })()}
            secondary={`${display.cores} cores`}
            pct={display.cpu ?? lastValue(cpuHistory)}
            history={cpuHistory}
        />
        <SpecCard
            label="Memory"
            icon="material-symbols:storage-rounded"
            iconColor="#22c55e"
            chartColor="#22c55e"
            primary={display.mem !== null ? formatBytes(display.mem / 100 * display.memTotal) : (() => { const v = lastValue(memHistory); return v !== null ? `${v.toFixed(1)}%` : null; })()}
            secondary={display.memTotal > 1 ? `/ ${formatBytes(display.memTotal)}` : undefined}
            pct={display.mem ?? lastValue(memHistory)}
            history={memHistory}
        />
        <SpecCard
            label="Upload"
            icon="material-symbols:upload-rounded"
            iconColor="#f59e0b"
            chartColor="#f59e0b"
            primary={display.upload !== null ? `${formatBytes(display.upload / 100 * display.uploadBw)}/s` : (() => { const v = lastValue(uploadHistory); return v !== null ? `${v.toFixed(1)}%` : null; })()}
            secondary={display.uploadBw > 0 ? `/ ${formatBytes(display.uploadBw)}/s` : undefined}
            pct={display.upload ?? lastValue(uploadHistory)}
            history={uploadHistory}
        />
        <SpecCard
            label="Download"
            icon="material-symbols:download-rounded"
            iconColor="#a855f7"
            chartColor="#a855f7"
            primary={display.download !== null ? `${formatBytes(display.download / 100 * display.downloadBw)}/s` : (() => { const v = lastValue(downloadHistory); return v !== null ? `${v.toFixed(1)}%` : null; })()}
            secondary={display.downloadBw > 0 ? `/ ${formatBytes(display.downloadBw)}/s` : undefined}
            pct={display.download ?? lastValue(downloadHistory)}
            history={downloadHistory}
        />
    </>;
}

const TABS = [
    { label: 'General', value: '' },
    { label: 'Instances', value: 'instances' },
    { label: 'Clients', value: 'clients' },
    { label: 'Logs', value: 'logs' },
];

export function RelayShell({ children }: { children: React.ReactNode }) {
    const { relayId, relay, specs, loading, error, actionLoading, clientCount, refresh, stop, restart } = useRelayContext();
    const router = useRouter();
    const pathname = usePathname();

    const basePath = `/relays/${relayId}`;
    const activeTab = pathname === basePath ? '' : pathname.slice(basePath.length + 1).split('/')[0];

    const dot = relay ? relayStatusColor(relay) : 'bg-zinc-400';
    const runnerStatus = relay?.runner?.status ?? (relay?.connected ? 'connected' : 'offline');
    const uptime = relay?.status?.uptime ? formatDistanceToNow(new Date(relay.status.uptime)) : null;

    const label = relay
        ? relay.label ?? `Relay #${relay.id}`
        : null;

    const subtitle = [
        relay?.provider,
        uptime ? `up ${uptime}` : null
    ].filter(Boolean)

    return (
        <>
            <SiteHeader
                before={
                    <Button variant="ghost" size="icon-sm" onClick={() => router.push('/relays')} aria-label="Back">
                        <Icon icon="material-symbols:arrow-back-rounded" className="size-4" />
                    </Button>
                }

                subtitle={<>
                    {subtitle.map((part, i) => <span key={i}>{part}</span>)}
                </>}

                after={relay && <>
                    {relay.status && <>
                        <Badge variant="secondary" className={cn("text-xs capitalize hidden sm:flex", dot)}>
                            {runnerStatus}
                        </Badge>

                        <Badge variant="secondary" className="text-xs hidden sm:flex">
                            {relay.status.engine}/{`${relay.status.version}`}
                        </Badge>
                    </>}
                    <Button variant="ghost" size="icon-sm" onClick={stop} disabled={actionLoading || !relay.connected} aria-label="Stop">
                        <Icon icon="material-symbols:stop-rounded" className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={restart} disabled={actionLoading || !relay.connected} aria-label="Restart">
                        <Icon icon="material-symbols:restart-alt-rounded" className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={refresh} aria-label="Refresh">
                        <Icon icon="material-symbols:refresh-rounded" className="size-4" />
                    </Button>
                </>}>
                {label ?? `Relay #${relayId}`}
            </SiteHeader>
            <div className="flex flex-1 flex-col p-4 md:p-6 gap-4">

                {/* Error */}
                {error && (
                    <Alert variant="destructive">
                        <Icon icon="material-symbols:error-circle-rounded" className="size-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {loading ? (
                        Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)
                    ) : relay ? (
                        <SpecCards specs={specs} />
                    ) : null}
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={v => router.push(v === '' ? basePath : `${basePath}/${v}`)}>
                    <TabsList className="w-full justify-start">
                        {TABS.map(tab => (
                            <TabsTrigger key={tab.value} value={tab.value}>
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>

                {/* Tab content */}
                <div className="flex flex-1 flex-col min-h-0">
                    {children}
                </div>
            </div>
        </>
    );
}
