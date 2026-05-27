'use client';

import * as React from 'react';
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type SortingState,
    type VisibilityState,
} from '@tanstack/react-table';
import { SiteHeader } from '@/components/site-header';
import { Input } from '@/components/ui/input';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { listActivity, deleteActivity } from '@/lib/api/activity';
import { batchGetUsers } from '@/lib/api/users';
import { useWsEvent } from '@/lib/ws/context';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@/hooks/use-mobile';
import type { ApiActivityEvent, ApiUser } from '@/types/api';
import { NotFound } from '@/app/(dashboard)/not-found';
import { useApi } from '@/lib/api/context';

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_HUES: Record<string, number> = {
    user: 142, world: 270, relay: 25, auth: 210, admin: 0, node: 215, avatar: 310,
};

function typeHue(type: string): number {
    const prefix = type.split('.')[0];
    if (prefix in TYPE_HUES) return TYPE_HUES[prefix];
    let hash = 0;
    for (let i = 0; i < prefix.length; i++)
        hash = prefix.charCodeAt(i) + ((hash << 5) - hash);
    return Math.abs(hash) % 360;
}

function typeIcon(type: string): string {
    const prefix = type.split('.')[0];
    const icons: Record<string, string> = {
        user: 'material-symbols:person-rounded',
        world: 'material-symbols:public',
        relay: 'material-symbols:dns',
        auth: 'material-symbols:lock-rounded',
        admin: 'material-symbols:shield-rounded',
        node: 'material-symbols:memory-rounded',
        avatar: 'material-symbols:face-rounded',
    };
    return icons[prefix] ?? 'material-symbols:bolt-rounded';
}

// ── Detail drawer ─────────────────────────────────────────────────────────────

function ActivityDrawer({
    event,
    open,
    onOpenChange,
    onDelete,
    userMap,
}: {
    event: ApiActivityEvent | null;
    open: boolean;
    onOpenChange: (v: boolean) => void;
    onDelete: (id: number) => void;
    userMap: Map<string, ApiUser>;
}) {
    const isMobile = useIsMobile();
    const [deleting, setDeleting] = React.useState(false);
    const { t } = useTranslation();

    if (!event) return null;
    const h = typeHue(event.type);

    async function handleDelete() {
        if (!event) return;
        setDeleting(true);
        try {
            await deleteActivity(event.id);
            onDelete(event.id);
            onOpenChange(false);
        } catch {
            setDeleting(false);
        }
    }

    return (
        <Drawer open={open} onOpenChange={onOpenChange} direction={isMobile ? 'bottom' : 'right'}>
            <DrawerContent>
                <DrawerHeader className="gap-1">
                    <DrawerTitle className="flex items-center gap-2">
                        <div
                            className="size-7 rounded-full flex items-center justify-center shrink-0"
                            style={{ background: `hsl(${h} 70% 50% / 0.12)` }}
                        >
                            <Icon icon={typeIcon(event.type)} className="size-4" style={{ color: `hsl(${h} 60% 40%)` }} />
                        </div>
                        {event.message}
                    </DrawerTitle>
                    <DrawerDescription>
                        <span
                            className="inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-mono font-semibold"
                            style={{
                                background: `hsl(${h} 70% 50% / 0.1)`,
                                color: `hsl(${h} 60% 40%)`,
                                borderColor: `hsl(${h} 70% 50% / 0.3)`,
                            }}
                        >
                            {event.type}
                        </span>
                    </DrawerDescription>
                </DrawerHeader>

                <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
                    <div className="rounded-md bg-muted/50 p-3 space-y-1.5">
                        {[
                            { label: 'ID', value: String(event.id) },
                            { label: 'Date', value: new Date(event.created_at).toLocaleString() },
                        ].map(({ label, value }) => (
                            <div key={label} className="flex justify-between gap-4">
                                <span className="text-muted-foreground">{label}</span>
                                <span className="font-mono text-xs text-right break-all">{value}</span>
                            </div>
                        ))}
                        {event.author !== null && (
                            <div className="flex justify-between items-center gap-4">
                                <span className="text-muted-foreground">Author</span>
                                <AuthorCell identifier={event.author} userMap={userMap} />
                            </div>
                        )}
                    </div>

                    {event.details !== null && event.details !== undefined && (
                        <>
                            <Separator />
                            <pre className="text-xs bg-muted rounded p-3 overflow-x-auto whitespace-pre-wrap break-all border border-border">
                                {JSON.stringify(event.details, null, 2)}
                            </pre>
                        </>
                    )}
                </div>

                <DrawerFooter>
                    <Button variant="destructive" disabled={deleting} onClick={handleDelete}>
                        {deleting
                            ? <Icon icon="material-symbols:progress-activity" className="size-4 animate-spin" />
                            : <Icon icon="material-symbols:delete-outline-rounded" className="size-4" />}
                        {t('common.delete')}
                    </Button>
                    <DrawerClose asChild>
                        <Button variant="outline">{t('common.close')}</Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

export default function ActivityPage() {
    const { isAdmin, isLoading } = useApi();
    const { t } = useTranslation();
    if (isLoading) return null;
    if (!isAdmin) return <NotFound />;
    return <ActivityPageInner />;
}

function ActivityPageInner() {
    const { t } = useTranslation();
    const [events, setEvents] = React.useState<ApiActivityEvent[]>([]);
    const [total, setTotal] = React.useState(-1);
    const [userMap, setUserMap] = React.useState<Map<string, ApiUser>>(new Map());
    const fetchedUsersRef = React.useRef<Set<string>>(new Set());
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [q, setQ] = React.useState('');
    const [pendingQ, setPendingQ] = React.useState('');
    const initializedRef = React.useRef(false);
    const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const abortRef = React.useRef<AbortController | null>(null);

    // Drawer state
    const [selected, setSelected] = React.useState<ApiActivityEvent | null>(null);
    const [drawerOpen, setDrawerOpen] = React.useState(false);

    // Table state
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 20 });

    const fetchEvents = React.useCallback(async (search: string) => {
        abortRef.current?.abort();
        abortRef.current = new AbortController();
        setLoading(true);
        setError(null);
        try {
            const res = await listActivity({ q: search || undefined, limit: PAGE_SIZE });
            setEvents(res.items);
            setTotal(res.total);
        } catch (err: unknown) {
            if ((err as Error)?.name !== 'AbortError')
                setError((err as Error)?.message ?? 'Failed to load activity');
        } finally {
            setLoading(false);
        }
    }, []);

    // Init from URL on mount
    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const urlQ = params.get('q') ?? '';
        const urlPage = Math.max(0, parseInt(params.get('page') ?? '1', 10) - 1);
        setPendingQ(urlQ);
        setQ(urlQ);
        if (urlPage > 0) setPagination(p => ({ ...p, pageIndex: urlPage }));
        fetchEvents(urlQ);
        initializedRef.current = true;
    }, [fetchEvents]);

    // Sync URL with search query and current page
    React.useEffect(() => {
        if (!initializedRef.current) return;
        const params = new URLSearchParams();
        if (q) params.set('q', q);
        if (pagination.pageIndex > 0) params.set('page', String(pagination.pageIndex + 1));
        const qs = params.toString();
        window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
    }, [q, pagination.pageIndex]);

    React.useEffect(() => {
        const toFetch = events
            .map(e => e.author)
            .filter((a): a is string => !!a && !fetchedUsersRef.current.has(a));
        if (toFetch.length === 0) return;
        for (const id of toFetch) fetchedUsersRef.current.add(id);
        batchGetUsers(toFetch)
            .then(res => {
                setUserMap(prev => {
                    const next = new Map(prev);
                    for (const user of res.items) {
                        for (const id of toFetch) {
                            const atIdx = id.lastIndexOf('@');
                            if (atIdx < 0) continue;
                            const rawId = id.slice(0, atIdx);
                            const server = id.slice(atIdx + 1);
                            if (user.server === server && String(user.id) === rawId) {
                                next.set(id, user);
                            }
                        }
                    }
                    return next;
                });
            })
            .catch(() => {});
    }, [events]);

    useWsEvent('activity', (data: unknown) => {
        const event = data as ApiActivityEvent;
        if (q) return;
        setEvents(prev => {
            if (prev.some(e => e.id === event.id)) return prev;
            return [event, ...prev];
        });
        setTotal(n => (n === -1 ? 1 : n + 1));
    });

    function handleDelete(id: number) {
        setEvents(prev => prev.filter(e => e.id !== id));
        setTotal(n => Math.max(0, n - 1));
    }

    function handlePendingQChange(value: string) {
        setPendingQ(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setQ(value);
            setEvents([]);
            setTotal(-1);
            setPagination(p => ({ ...p, pageIndex: 0 }));
            fetchEvents(value);
        }, 400);
    }

    function handleQClear() {
        setPendingQ('');
        if (debounceRef.current) clearTimeout(debounceRef.current);
        setQ('');
        setEvents([]);
        setTotal(-1);
        setPagination(p => ({ ...p, pageIndex: 0 }));
        fetchEvents('');
    }

    // ── Columns ──────────────────────────────────────────────────────────────

    const columns: ColumnDef<ApiActivityEvent>[] = React.useMemo(() => [
        {
            accessorKey: 'type',
            header: 'Type',
            cell: ({ row }) => {
                const h = typeHue(row.original.type);
                return (
                    <span
                        className="inline-flex items-center gap-1.5 rounded border px-1.5 py-0.5 text-[10px] font-mono font-semibold whitespace-nowrap"
                        style={{
                            background: `hsl(${h} 70% 50% / 0.1)`,
                            color: `hsl(${h} 60% 40%)`,
                            borderColor: `hsl(${h} 70% 50% / 0.3)`,
                        }}
                    >
                        <Icon icon={typeIcon(row.original.type)} className="size-3" />
                        {row.original.type}
                    </span>
                );
            },
        },
        {
            accessorKey: 'message',
            header: 'Message',
            cell: ({ row }) => (
                <button
                    className="text-left text-sm font-medium hover:underline underline-offset-2 w-full truncate max-w-[340px] block"
                    onClick={() => { setSelected(row.original); setDrawerOpen(true); }}
                >
                    {row.original.message}
                </button>
            ),
            enableHiding: false,
        },
        {
            accessorKey: 'author',
            header: 'Author',
            cell: ({ row }) => (
                <AuthorCell identifier={row.original.author} userMap={userMap} />
            ),
        },
        {
            accessorKey: 'created_at',
            header: 'Date',
            cell: ({ row }) => (
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(row.original.created_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                </span>
            ),
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const [deleting, setDeleting] = React.useState(false);
                return (
                    <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 text-muted-foreground hover:text-destructive"
                        disabled={deleting}
                        onClick={async () => {
                            setDeleting(true);
                            try { await deleteActivity(row.original.id); handleDelete(row.original.id); }
                            catch { setDeleting(false); }
                        }}
                    >
                        <Icon icon="material-symbols:delete-outline-rounded" className="size-3.5" />
                    </Button>
                );
            },
        },
    ], [userMap]);

    const table = useReactTable({
        data: events,
        columns,
        state: { sorting, columnVisibility, pagination },
        onSortingChange: setSorting,
        onColumnVisibilityChange: setColumnVisibility,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    return <>
        <SiteHeader
            children={t('admin.activity_log')}
            after={<>
                <Button variant="ghost" size="icon" className="size-8" onClick={() => { setEvents([]); setTotal(-1); fetchEvents(q); }}>
                    <Icon icon="material-symbols:refresh-rounded" className={cn('size-4', loading && 'animate-spin')} />
                </Button>
                <div className="relative w-64">
                    <Icon icon="material-symbols:search-rounded" className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                    <Input
                        placeholder="Search…"
                        value={pendingQ}
                        onChange={e => handlePendingQChange(e.target.value)}
                        className="h-8 pl-8 pr-8 text-sm"
                    />
                    {pendingQ && (
                        <button
                            type="button"
                            onClick={handleQClear}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <Icon icon="material-symbols:close-rounded" className="size-3.5" />
                        </button>
                    )}
                </div>
            </>}
        />
        <div className="flex flex-col gap-4 p-4 md:p-6">
            {error && (
                <Alert variant="destructive">
                    <Icon icon="material-symbols:error-circle-rounded" className="size-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Table */}
            <div className="overflow-hidden rounded-lg border">
                <Table>
                    <TableHeader className="sticky top-0 z-10 bg-muted">
                        {table.getHeaderGroups().map(hg => (
                            <TableRow key={hg.id}>
                                {hg.headers.map(h => (
                                    <TableHead key={h.id} colSpan={h.colSpan}>
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
                                    <TableCell><Skeleton className="h-5 w-20 rounded" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-56 rounded" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20 rounded" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24 rounded" /></TableCell>
                                    <TableCell />
                                </TableRow>
                            ))
                        ) : table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map(row => (
                                <TableRow key={row.id} className="h-12" data-state={row.getIsSelected() && 'selected'}>
                                    {row.getVisibleCells().map(cell => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                                    <Icon icon="material-symbols:history-rounded" className="size-8 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">{t('admin.no_activity')}</p>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-2">
                <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
                    {total > -1 ? `${total} event${total !== 1 ? 's' : ''}` : ''}
                </div>
                <div className="flex w-full items-center gap-6 lg:w-fit">
                    <div className="hidden items-center gap-2 lg:flex">
                        <Label htmlFor="rows-per-page" className="text-sm font-medium">Rows per page</Label>
                        <Select
                            value={`${table.getState().pagination.pageSize}`}
                            onValueChange={v => table.setPageSize(Number(v))}
                            items={[10, 20, 50].map(n => ({ label: `${n}`, value: `${n}` }))}
                        >
                            <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                                <SelectValue placeholder={table.getState().pagination.pageSize} />
                            </SelectTrigger>
                            <SelectContent side="top">
                                <SelectGroup>
                                    {[10, 20, 50].map(n => <SelectItem key={n} value={`${n}`}>{n}</SelectItem>)}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex w-fit items-center justify-center text-sm font-medium">
                        Page {table.getState().pagination.pageIndex + 1} of {Math.max(1, table.getPageCount())}
                    </div>
                    <div className="ml-auto flex items-center gap-2 lg:ml-0">
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
            </div>
        </div>

        <ActivityDrawer
            event={selected}
            open={drawerOpen}
            onOpenChange={setDrawerOpen}
            onDelete={handleDelete}
            userMap={userMap}
        />
    </>;
}

// ── Author cell ───────────────────────────────────────────────────────────────

function AuthorCell({ identifier, userMap }: { identifier: string | null; userMap: Map<string, ApiUser> }) {
    if (!identifier) return <span className="text-xs text-muted-foreground">—</span>;
    const user = userMap.get(identifier);
    if (!user) return <span className="font-mono text-xs text-muted-foreground">{identifier}</span>;
    const initials = (user.display ?? user.username).slice(0, 2).toUpperCase();
    return (
        <Link href={`/u/${user.username}`} className="flex items-center gap-2 w-fit hover:underline underline-offset-2">
            <Avatar className="size-6 shrink-0">
                <AvatarImage src={user.thumbnail ?? undefined} alt={user.display} />
                <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{user.display}</span>
        </Link>
    );
}

