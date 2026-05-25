'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
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
import { getProvider } from '@/lib/providers';
import { useTranslation } from 'react-i18next';

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

function formatPackets(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M pkt/s`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k pkt/s`;
    return `${Math.round(n)} pkt/s`;
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
    primary, secondary, pct, history, yMax,
}: {
    label: string; icon: string; iconColor: string; chartColor: string;
    primary: string | null; secondary?: string | null; pct?: number | null;
    history: HistoryPoint[]; yMax?: number;
}) {
    // Stable 15s time window domain so the axis scrolls in real time.
    const now = Date.now();
    const xDomain: [number, number] = [now - TIME_WINDOW, now];
    const yDomain: [number | string, number | string] = yMax !== undefined ? [0, yMax] : [0, 100];

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
                        <YAxis domain={yDomain} hide />
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
                <p className="text-sm font-medium font-mono leading-tight truncate">{primary ?? '—'}</p>
                {secondary && <p className="text-xs font-mono text-muted-foreground truncate">{secondary}</p>}
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
    const [cpuHistory, setCpuHistory] = useState<HistoryPoint[]>([]);
    const [memHistory, setMemHistory] = useState<HistoryPoint[]>([]);
    const [uploadHistory, setUploadHistory] = useState<HistoryPoint[]>([]);
    const [downloadHistory, setDownloadHistory] = useState<HistoryPoint[]>([]);
    const [txPacketsHistory, setTxPacketsHistory] = useState<HistoryPoint[]>([]);
    const [rxPacketsHistory, setRxPacketsHistory] = useState<HistoryPoint[]>([]);

    // Displayed (smoothed) values — updated only on each sample flush.
    const [display, setDisplay] = useState<{
        cpu: number | null; mem: number | null;
        upload: number | null; download: number | null;
        txPackets: number | null; rxPackets: number | null;
        memBytes: number; uploadBytes: number; downloadBytes: number;
        cores: number; memTotal: number; uploadBw: number; downloadBw: number;
        mtu: number;
    }>({
        cpu: null, mem: null, upload: null, download: null,
        txPackets: null, rxPackets: null,
        memBytes: 0, uploadBytes: 0, downloadBytes: 0,
        cores: 1, memTotal: 1, uploadBw: 0, downloadBw: 0,
        mtu: 1452,
    });

    // Accumulators: collect raw values between sample flushes.
    const acc = useRef<{
        cpu: number[]; mem: number[];
        upload: number[]; download: number[];
        txPackets: number[]; rxPackets: number[];
        // keep the latest metadata
        cores: number; memTotal: number; uploadBw: number; downloadBw: number;
        mtu: number;
    }>({
        cpu: [], mem: [], upload: [], download: [],
        txPackets: [], rxPackets: [],
        cores: 1, memTotal: 1, uploadBw: 0, downloadBw: 0,
        mtu: 1452,
    });

    const initialized = useRef(false);

    // Target values for lerp interpolation.
    const target = useRef<{
        cpu: number; mem: number; upload: number; download: number;
        txPackets: number; rxPackets: number;
        cores: number; memTotal: number; uploadBw: number; downloadBw: number;
        mtu: number;
    } | null>(null);

    // Feed raw values into the accumulator on every specs push — no state update.
    useEffect(() => {
        if (!specs) return;
        const cpuPct = Math.min(100, (specs.processor.used / Math.max(1, specs.processor.cores)) * 100);
        const memPct = specs.memory.total > 0 ? (specs.memory.used / specs.memory.total) * 100 : 0;
        const uploadPct = specs.upload.bandwidth > 0 ? (specs.upload.used / specs.upload.bandwidth) * 100 : 0;
        const downloadPct = specs.download.bandwidth > 0 ? (specs.download.used / specs.download.bandwidth) * 100 : 0;
        const txPkt = specs.upload.packets ?? 0;
        const rxPkt = specs.download.packets ?? 0;
        acc.current.cpu.push(cpuPct);
        acc.current.mem.push(memPct);
        acc.current.upload.push(uploadPct);
        acc.current.download.push(downloadPct);
        acc.current.txPackets.push(txPkt);
        acc.current.rxPackets.push(rxPkt);
        acc.current.cores = specs.processor.cores;
        acc.current.memTotal = specs.memory.total;
        acc.current.uploadBw = specs.upload.bandwidth;
        acc.current.downloadBw = specs.download.bandwidth;
        acc.current.mtu = specs.mtu ?? 1452;

        // Immediately populate display on first specs received (no lerp from null).
        if (!initialized.current) {
            initialized.current = true;
            const now = Date.now();
            setCpuHistory([{ v: cpuPct, t: now }]);
            setMemHistory([{ v: memPct, t: now }]);
            setUploadHistory([{ v: uploadPct, t: now }]);
            setDownloadHistory([{ v: downloadPct, t: now }]);
            setTxPacketsHistory([{ v: txPkt, t: now }]);
            setRxPacketsHistory([{ v: rxPkt, t: now }]);
            target.current = {
                cpu: cpuPct, mem: memPct, upload: uploadPct, download: downloadPct,
                txPackets: txPkt, rxPackets: rxPkt,
                cores: specs.processor.cores, memTotal: specs.memory.total,
                uploadBw: specs.upload.bandwidth, downloadBw: specs.download.bandwidth,
                mtu: specs.mtu ?? 1452,
            };
            setDisplay({
                cpu: cpuPct, mem: memPct,
                upload: uploadPct, download: downloadPct,
                txPackets: txPkt, rxPackets: rxPkt,
                memBytes: specs.memory.total, uploadBytes: specs.upload.bandwidth,
                downloadBytes: specs.download.bandwidth,
                cores: specs.processor.cores, memTotal: specs.memory.total,
                uploadBw: specs.upload.bandwidth, downloadBw: specs.download.bandwidth,
                mtu: specs.mtu ?? 1452,
            });
        }
    }, [specs]);

    // Every SAMPLE_INTERVAL: average the accumulator, push one chart point, update lerp target.
    useEffect(() => {
        const avg = (arr: number[]) =>
            arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

        const id = setInterval(() => {
            const a = acc.current;
            const cpuAvg = avg(a.cpu);
            const memAvg = avg(a.mem);
            const uploadAvg = avg(a.upload);
            const downloadAvg = avg(a.download);
            const txPacketsAvg = avg(a.txPackets);
            const rxPacketsAvg = avg(a.rxPackets);

            // Clear accumulators.
            a.cpu = []; a.mem = []; a.upload = []; a.download = [];
            a.txPackets = []; a.rxPackets = [];

            if (cpuAvg === null) return; // no data yet

            const now = Date.now();
            const cutoff = now - TIME_WINDOW;
            const trim = (arr: HistoryPoint[]) => arr.filter(p => p.t >= cutoff);

            setCpuHistory(p => [...trim(p), { v: cpuAvg!, t: now }]);
            setMemHistory(p => [...trim(p), { v: memAvg!, t: now }]);
            setUploadHistory(p => [...trim(p), { v: uploadAvg!, t: now }]);
            setDownloadHistory(p => [...trim(p), { v: downloadAvg!, t: now }]);
            setTxPacketsHistory(p => [...trim(p), { v: txPacketsAvg ?? 0, t: now }]);
            setRxPacketsHistory(p => [...trim(p), { v: rxPacketsAvg ?? 0, t: now }]);

            // Update lerp target — display will catch up via the lerp interval.
            target.current = {
                cpu: cpuAvg, mem: memAvg!,
                upload: uploadAvg!, download: downloadAvg!,
                txPackets: txPacketsAvg ?? target.current?.txPackets ?? 0,
                rxPackets: rxPacketsAvg ?? target.current?.rxPackets ?? 0,
                cores: a.cores, memTotal: a.memTotal,
                uploadBw: a.uploadBw, downloadBw: a.downloadBw,
                mtu: a.mtu,
            };
        }, SAMPLE_INTERVAL);
        return () => clearInterval(id);
    }, []);

    // Lerp display toward target at ~20 fps.
    useEffect(() => {
        const ALPHA = 0.18; // per 50 ms tick — reaches ~95 % of target in ~750 ms
        const id = setInterval(() => {
            if (!target.current) return;
            setDisplay(prev => {
                if (prev.cpu === null) return prev; // not yet initialized
                const t = target.current!;
                const lerp = (a: number, b: number) => a + (b - a) * ALPHA;
                return {
                    ...prev,
                    cpu: lerp(prev.cpu, t.cpu),
                    mem: lerp(prev.mem!, t.mem),
                    upload: lerp(prev.upload!, t.upload),
                    download: lerp(prev.download!, t.download),
                    txPackets: lerp(prev.txPackets ?? t.txPackets, t.txPackets),
                    rxPackets: lerp(prev.rxPackets ?? t.rxPackets, t.rxPackets),
                    cores: t.cores,
                    memTotal: t.memTotal,
                    uploadBw: t.uploadBw,
                    downloadBw: t.downloadBw,
                    mtu: t.mtu,
                };
            });
        }, 50);
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
        <SpecCard
            label="TX Packets"
            icon="material-symbols:upload-rounded"
            iconColor="#f59e0b"
            chartColor="#f59e0b"
            primary={display.txPackets !== null ? formatPackets(display.txPackets) : (() => { const v = lastValue(txPacketsHistory); return v !== null ? formatPackets(v) : null; })()}
            secondary={display.uploadBw > 0 && display.mtu > 0 ? `/ ${formatPackets(display.uploadBw / display.mtu)}` : undefined}
            history={txPacketsHistory}
            yMax={display.uploadBw > 0 && display.mtu > 0 ? display.uploadBw / display.mtu : undefined}
        />
        <SpecCard
            label="RX Packets"
            icon="material-symbols:download-rounded"
            iconColor="#a855f7"
            chartColor="#a855f7"
            primary={display.rxPackets !== null ? formatPackets(display.rxPackets) : (() => { const v = lastValue(rxPacketsHistory); return v !== null ? formatPackets(v) : null; })()}
            secondary={display.downloadBw > 0 && display.mtu > 0 ? `/ ${formatPackets(display.downloadBw / display.mtu)}` : undefined}
            history={rxPacketsHistory}
            yMax={display.downloadBw > 0 && display.mtu > 0 ? display.downloadBw / display.mtu : undefined}
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
    const { t } = useTranslation();
    const [confirmAction, setConfirmAction] = useState<'stop' | 'restart' | null>(null);

    const handleConfirm = async () => {
        if (confirmAction === 'stop') await stop();
        else if (confirmAction === 'restart') await restart();
        setConfirmAction(null);
    };

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

                after={relay && <>
                    <Badge variant="secondary" className="text-xs hidden sm:flex">
                        <Icon icon={getProvider(relay.provider).icon} className="size-3 mr-1" />
                        {t(getProvider(relay.provider).label)}
                    </Badge>
                    {relay.status && <>

                        <Badge variant="secondary" className={cn("text-xs capitalize hidden sm:flex", dot)}>
                            {runnerStatus}
                        </Badge>

                        <Badge variant="secondary" className="text-xs hidden sm:flex">
                            {relay.status.engine}/{`${relay.status.version}`}
                        </Badge>
                    </>}
                    <Button variant="ghost" size="icon-sm" onClick={() => setConfirmAction('stop')} disabled={actionLoading || !relay.connected} aria-label="Stop">
                        <Icon icon="material-symbols:stop-rounded" className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => setConfirmAction('restart')} disabled={actionLoading || !relay.connected} aria-label="Restart">
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

            {/* Stop / Restart confirmation modals */}
            <Dialog open={confirmAction !== null} onOpenChange={(open) => { if (!open && !actionLoading) setConfirmAction(null); }}>
                <DialogContent showCloseButton={false}>
                    <DialogHeader>
                        <DialogTitle>
                            {confirmAction === 'stop' ? 'Stop relay' : 'Restart relay'}
                        </DialogTitle>
                        <DialogDescription>
                            {confirmAction === 'stop'
                                ? 'This will stop the relay and disconnect all active clients. Continue?'
                                : 'This will restart the relay and temporarily disconnect all active clients. Continue?'}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmAction(null)} disabled={actionLoading}>
                            Cancel
                        </Button>
                        <Button
                            variant={confirmAction === 'stop' ? 'destructive' : 'default'}
                            onClick={handleConfirm}
                            disabled={actionLoading}
                        >
                            {actionLoading
                                ? <Icon icon="material-symbols:progress-activity" className="size-4 animate-spin" />
                                : confirmAction === 'stop' ? 'Stop' : 'Restart'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
