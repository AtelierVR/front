'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type SortingState,
} from '@tanstack/react-table';
import { PageTitle } from '@/components/shared/PageTitle';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import { listRelays, getRelay, getRelayInstances } from '@/lib/api/relays';
import { useWsEvent } from '@/lib/ws/context';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslation } from 'react-i18next';
import type { ApiRelay, ApiRelayAssignedInstance, ApiRelaySpecs } from '@/types/api';
import { useApi } from '@/lib/api';
import { NotFound } from '@/app/(dashboard)/not-found';
import { getProvider } from '@/lib/providers';

// ── Helpers ───────────────────────────────────────────────────────────────────

function relayLabel(relay: ApiRelay): string {
    if (!relay.label) return `Relay #${relay.id}`;
    if (typeof relay.label === 'string') return relay.label;
    const obj = relay.label as Record<string, string>;
    return obj['en'] ?? Object.values(obj)[0] ?? `Relay #${relay.id}`;
}

function cpuPct(relay: ApiRelay): number | null {
    const cpu = relay.status?.specs?.processor;
    if (!cpu) return null;
    return Math.min(100, (cpu.used / Math.max(1, cpu.cores)) * 100);
}

function CpuBar({ pct }: { pct: number | null }) {
    if (pct === null) return <span className="text-xs text-muted-foreground">N/A</span>;
    const color = pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-yellow-500' : 'bg-green-500';
    return (
        <div className="flex items-center gap-2 min-w-[80px]">
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs tabular-nums text-muted-foreground w-9 text-right">{pct.toFixed(0)}%</span>
        </div>
    );
}

function statusColor(relay: ApiRelay): string {
    if (!relay.connected) return 'bg-muted';
    const s = relay.runner?.status;
    if (s === 'running') return 'bg-green-500';
    if (s === 'pending' || s === 'starting') return 'bg-yellow-500';
    return 'bg-muted';
}

function statusText(relay: ApiRelay, t: (k: string) => string): string {
    if (!relay.connected) return t('admin.relay_offline');
    const s = relay.runner?.status;
    if (s === 'running') return t('admin.relay_running');
    if (s === 'pending') return t('admin.relay_pending');
    if (s === 'starting') return t('admin.relay_starting');
    return t('admin.relay_connected');
}

// ── InfoRow ───────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-4 py-1.5">
            <span className="text-sm text-muted-foreground shrink-0">{label}</span>
            <span className="text-sm text-right font-mono break-all">{value ?? '—'}</span>
        </div>
    );
}

// ── Detail drawer ─────────────────────────────────────────────────────────────

function RelayDrawer({
    relay,
    open,
    onOpenChange,
}: {
    relay: ApiRelay | null;
    open: boolean;
    onOpenChange: (v: boolean) => void;
}) {
    const isMobile = useIsMobile();
    const { t } = useTranslation();
    const [assigned, setAssigned] = React.useState<ApiRelayAssignedInstance[] | null>(null);

    React.useEffect(() => {
        if (!open || !relay) return;
        setAssigned(null);
        getRelayInstances(relay.id)
            .then(r => setAssigned(r.items))
            .catch(() => setAssigned([]));
    }, [open, relay]);

    if (!relay) return null;

    const isRunning = relay.connected && relay.runner?.status === 'running';
    const meta = relay.runner?.meta ?? {};

    return (
        <Drawer open={open} onOpenChange={onOpenChange} direction={isMobile ? 'bottom' : 'right'}>
            <DrawerContent>
                <DrawerHeader className="gap-1">
                    <DrawerTitle className="flex items-center gap-2">
                        <div
                            className={cn(
                                'size-2.5 rounded-full shrink-0',
                                statusColor(relay),
                                isRunning && 'animate-pulse',
                            )}
                        />
                        {relayLabel(relay)}
                    </DrawerTitle>
                    <DrawerDescription className="font-mono text-xs">{relay.provider}</DrawerDescription>
                </DrawerHeader>

                <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
                    {/* General info */}
                    <div className="rounded-md border border-border bg-accent/10 p-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t('admin.general')}</p>
                        <div className="space-y-0.5">
                            <InfoRow label="ID" value={relay.id} />
                            <InfoRow label="Provider" value={relay.provider} />
                            <InfoRow label="Provider ID" value={relay.provider_id} />
                            <InfoRow label="Runner status" value={relay.runner?.status ?? 'none'} />
                            <InfoRow label="Started at" value={relay.runner?.started_at ?? null} />
                            <InfoRow label="Connected" value={relay.connected ? t('common.yes') : t('common.no')} />
                            <InfoRow label="Created at" value={new Date(relay.created_at).toLocaleString()} />
                            {relay.status && (
                                <>
                                    <InfoRow label="Engine" value={`${relay.status.engine} ${relay.status.version}`} />
                                    <InfoRow label="Protocol" value={relay.status.protocol} />
                                    <InfoRow label="Ping" value={relay.status.ping !== null ? `${relay.status.ping}ms` : null} />
                                </>
                            )}
                        </div>
                    </div>

                    {/* Tags */}
                    {relay.tags.length > 0 && (
                        <div className="rounded-md border border-border bg-accent/10 p-3">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t('world.tags')}</p>
                            <div className="flex flex-wrap gap-1.5">
                                {relay.tags.map(tag => (
                                    <span key={tag} className="text-xs bg-muted/80 px-2.5 py-1 rounded border border-border font-mono">{tag}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    <Separator />

                    {/* Assigned instances */}
                    <div className="rounded-md border border-border bg-accent/10 p-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            {t('admin.assigned_instances')}
                            {assigned !== null && (
                                <span className="ml-2 normal-case font-normal text-muted-foreground/70">({assigned.length})</span>
                            )}
                        </p>
                        {assigned === null ? (
                            <Skeleton className="h-8 rounded" />
                        ) : assigned.length === 0 ? (
                            <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                                <Icon icon="material-symbols:deployed-code" className="size-4 opacity-40" />
                                {t('admin.no_relay_instances')}
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                {assigned.map(i => (
                                    <div key={i.id} className="flex items-center justify-between py-1.5 px-2.5 rounded bg-muted/50 border border-border">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <Icon icon="material-symbols:deployed-code" className="size-4 shrink-0 text-muted-foreground" />
                                            <span className="text-sm font-mono truncate">{i.name}</span>
                                            {i.title && <span className="text-xs text-muted-foreground truncate ml-1">· {i.title}</span>}
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground font-mono">
                                            <span>cap: {i.capacity === 0 ? '∞' : i.capacity}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Runner meta */}
                    {Object.keys(meta).length > 0 && (
                        <div className="rounded-md border border-border bg-accent/10 p-3">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t('admin.runner_meta')}</p>
                            <div className="space-y-0.5">
                                {Object.entries(meta).map(([k, v]) => (
                                    <InfoRow key={k} label={k} value={v as React.ReactNode} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <DrawerFooter>
                    <DrawerClose asChild>
                        <Button variant="outline">{t('common.close')}</Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}

// ── Memoized row ──────────────────────────────────────────────────────────────
// Each row manages its own CPU lerp so updates to one relay never re-render others.

const MemoRelayRow = React.memo(function RelayRow({ relay }: { relay: ApiRelay }) {
    const { t } = useTranslation();
    const router = useRouter();

    const targetPct = cpuPct(relay);
    const [displayPct, setDisplayPct] = React.useState<number | null>(targetPct);
    const displayRef = React.useRef(displayPct);
    displayRef.current = displayPct;

    React.useEffect(() => {
        if (targetPct === null) { setDisplayPct(null); return; }
        if (displayRef.current === null) { setDisplayPct(targetPct); return; }
        const ALPHA = 0.18;
        const id = setInterval(() => {
            const cur = displayRef.current ?? targetPct;
            const lerped = cur + (targetPct - cur) * ALPHA;
            if (Math.abs(lerped - cur) < 0.05) {
                setDisplayPct(targetPct);
                clearInterval(id);
            } else {
                setDisplayPct(lerped);
            }
        }, 50);
        return () => clearInterval(id);
    }, [targetPct]);

    const isRunning = relay.connected && relay.runner?.status === 'running';
    const provider = getProvider(relay.provider);

    return (
        <TableRow className="h-12 cursor-pointer" onClick={() => router.push(`/relays/${relay.id}`)}>
            <TableCell>
                <div className={cn('size-2.5 rounded-full mx-auto', statusColor(relay), isRunning && 'animate-pulse')} />
            </TableCell>
            <TableCell>
                <span className="text-sm font-medium truncate max-w-[240px] block">{relayLabel(relay)}</span>
            </TableCell>
            <TableCell>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Icon icon={provider.icon} className="size-3.5 shrink-0" />
                    {t(provider.label)}
                </span>
            </TableCell>
            <TableCell>
                <span className="text-sm tabular-nums">
                    {relay.status ? `${relay.status.instances.count}/${relay.status.instances.limit}` : 'N/A'}
                </span>
            </TableCell>
            <TableCell>
                <span className="text-sm tabular-nums">{relay.status ? relay.status.clients : 'N/A'}</span>
            </TableCell>
            <TableCell style={{ width: 140, minWidth: 140, maxWidth: 140 }}>
                {displayPct === null ? (
                    <span className="text-xs text-muted-foreground">N/A</span>
                ) : (
                    <div className="flex items-center gap-2 w-[120px]">
                        <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden shrink-0">
                            <div
                                className={`h-full rounded-full ${displayPct > 80 ? 'bg-red-500' : displayPct > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                style={{ width: `${displayPct}%` }}
                            />
                        </div>
                        <span className="text-xs tabular-nums text-muted-foreground w-9 shrink-0 text-right">{displayPct.toFixed(0)}%</span>
                    </div>
                )}
            </TableCell>
        </TableRow>
    );
});

// ── Main page ─────────────────────────────────────────────────────────────────

export default function RelaysPage() {
    const { isAdmin, isLoading } = useApi();
    const { t } = useTranslation();
    if (isLoading) return null;
    if (!isAdmin) return <NotFound />;
    return <RelaysPageInner />;
}

function RelaysPageInner() {
    const { t } = useTranslation();
    const [relays, setRelays] = React.useState<ApiRelay[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | undefined>();
    const loadedRef = React.useRef(false);

    // Drawer state — kept for future use
    const [selected, setSelected] = React.useState<ApiRelay | null>(null);
    const [drawerOpen, setDrawerOpen] = React.useState(false);

    // Table state
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 20 });

    const fetchRelays = React.useCallback(async () => {
        setLoading(true);
        setError(undefined);
        try {
            const data = await listRelays();
            setRelays(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load relays');
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        if (loadedRef.current) return;
        loadedRef.current = true;
        fetchRelays();
    }, [fetchRelays]);

    useWsEvent('relay_status_change', (payload: unknown) => {
        const data = payload as { relay_id: number; status?: string; relay?: ApiRelay | null };
        if (data.relay) {
            setRelays(prev => prev.map(r => r.id === data.relay_id ? data.relay! : r));
        } else if (data.status === 'disconnected') {
            setRelays(prev => prev.map(r =>
                r.id === data.relay_id ? { ...r, connected: false } : r
            ));
        } else if (data.status === 'connected') {
            setRelays(prev => prev.map(r =>
                r.id === data.relay_id ? { ...r, connected: true } : r
            ));
        } else {
            // up, down, ready — re-fetch pour avoir le runner.status à jour
            getRelay(data.relay_id)
                .then(relay => setRelays(prev => prev.map(r => r.id === relay.id ? relay : r)))
                .catch(() => {});
        }
    });

    useWsEvent('relay_added', () => { fetchRelays(); });

    useWsEvent('relay_removed', () => { fetchRelays(); });

    useWsEvent('relay_specs_update', (payload: unknown) => {
        const data = payload as { relay_id: number; details: ApiRelaySpecs };
        setRelays(prev => prev.map(r => {
            if (r.id !== data.relay_id || !r.status) return r;
            return { ...r, status: { ...r.status, specs: data.details } };
        }));
    });

    useWsEvent('relay_client_connected', (payload: unknown) => {
        const data = payload as { relay_id: number };
        setRelays(prev => prev.map(r => {
            if (r.id !== data.relay_id || !r.status) return r;
            return { ...r, status: { ...r.status, clients: r.status.clients + 1 } };
        }));
    });

    useWsEvent('relay_client_disconnected', (payload: unknown) => {
        const data = payload as { relay_id: number };
        setRelays(prev => prev.map(r => {
            if (r.id !== data.relay_id || !r.status) return r;
            return { ...r, status: { ...r.status, clients: Math.max(0, r.status.clients - 1) } };
        }));
    });

    // ── Columns ──────────────────────────────────────────────────────────────

    // Column definitions are used only for headers and sorting — cell rendering
    // happens in MemoRelayRow to avoid full-list re-renders on partial updates.
    const columns: ColumnDef<ApiRelay>[] = React.useMemo(() => [
        { id: 'status',       header: '',           size: 32,  enableSorting: false },
        { accessorKey: 'label',    header: 'Name',      enableHiding: false },
        { accessorKey: 'provider', header: 'Provider' },
        { id: 'instances',    header: 'Instances',  enableSorting: false },
        { id: 'clients',      header: 'Clients',    enableSorting: false },
        { id: 'relay_status', header: 'CPU',        size: 140, minSize: 140, maxSize: 140, enableSorting: false },
    ], [t]);

    const table = useReactTable({
        data: relays,
        columns,
        state: { sorting, pagination },
        onSortingChange: setSorting,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    return (
        <>
            <PageTitle title={t('admin.relays')} />
            <SiteHeader
                children={t('admin.relays')}
                after={<>
                    <Button variant="ghost" size="icon" className="size-8" onClick={fetchRelays} disabled={loading}>
                        <Icon icon="material-symbols:refresh-rounded" className={cn('size-4', loading && 'animate-spin')} />
                    </Button>
                </>}
            />
            <div className="flex flex-col gap-4 p-4 md:p-6">
                {error && (
                    <Alert variant="destructive">
                        <Icon icon="material-symbols:error-circle-rounded" className="size-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="overflow-hidden rounded-lg border">
                    <Table>
                        <TableHeader className="sticky top-0 z-10 bg-muted">
                            {table.getHeaderGroups().map(hg => (
                                <TableRow key={hg.id}>
                                    {hg.headers.map(h => (
                                        <TableHead key={h.id} colSpan={h.colSpan} style={h.column.columnDef.size ? { width: h.column.getSize(), minWidth: h.column.columnDef.minSize, maxWidth: h.column.columnDef.maxSize } : undefined}>
                                            {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: pagination.pageSize }).map((_, i) => (
                                    <TableRow key={i} className="h-12">
                                        <TableCell><Skeleton className="size-2.5 rounded-full" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-40 rounded" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-20 rounded" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-12 rounded" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-8 rounded" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-20 rounded" /></TableCell>
                                    </TableRow>
                                ))
                            ) : table.getRowModel().rows.length ? (
                                table.getRowModel().rows.map(row => (
                                    <MemoRelayRow key={row.original.id} relay={row.original} />
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                                        <Icon icon="material-symbols:dns" className="size-8 mx-auto mb-2 opacity-30" />
                                        <p className="text-sm">{t('admin.no_relays')}</p>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {!loading && relays.length > 0 && (
                    <div className="flex items-center justify-between gap-4 px-2">
                        <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
                            {relays.length} relay{relays.length !== 1 ? 's' : ''}
                        </div>
                        <div className="flex items-center gap-2">
                            <Label className="text-muted-foreground text-sm">Rows per page</Label>
                            <Select
                                value={String(table.getState().pagination.pageSize)}
                                onValueChange={v => table.setPageSize(Number(v))}
                            >
                                <SelectTrigger className="h-8 w-20">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {[10, 20, 50].map(n => (
                                            <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                                Page {table.getState().pagination.pageIndex + 1} of {Math.max(1, table.getPageCount())}
                            </span>
                            <Button variant="outline" className="hidden size-8 lg:flex" size="icon"
                                onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
                                <Icon icon="material-symbols:keyboard-double-arrow-left-rounded" />
                            </Button>
                            <Button variant="outline" className="size-8" size="icon"
                                onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                                <Icon icon="material-symbols:chevron-left-rounded" />
                            </Button>
                            <Button variant="outline" className="size-8" size="icon"
                                onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                                <Icon icon="material-symbols:chevron-right-rounded" />
                            </Button>
                            <Button variant="outline" className="hidden size-8 lg:flex" size="icon"
                                onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
                                <Icon icon="material-symbols:keyboard-double-arrow-right-rounded" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
