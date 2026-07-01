'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { PageTitle } from '@/components/shared/PageTitle';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import { EmptyBox } from '@/components/shared/ResultGrid';
import { useApi } from '@/lib/api';
import { listMyTables, downloadMyTable, deleteMyTable } from '@/lib/api/tables';
import type { TableMeta } from '@/lib/api/tables';
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from '@/components/ui/accordion';

type MimeInfos = { icon: string; bg: string };

const MIME_ICONS: Record<string, MimeInfos | ((t: TableMeta) => MimeInfos)> = {
    '+favorite$': {
        icon: 'material-symbols:favorite-rounded',
        bg: 'bg-rose-500/20 text-rose-500'
    },
    '+world$': {
        icon: 'material-symbols:public',
        bg: 'bg-emerald-500/20 text-emerald-500'
    },
    '+avatar$': {
        icon: 'material-symbols:accessibility-new-rounded',
        bg: 'bg-violet-500/20 text-violet-500'
    },
    '^application/octet-stream': {
        icon: 'material-symbols:attach-file-rounded',
        bg: 'bg-muted text-muted-foreground'
    },    
    '^application/json': {
        icon: 'material-symbols:data-object-rounded',
        bg: 'bg-muted text-muted-foreground'
    },
    default: {
        icon: 'material-symbols:draft-rounded',
        bg: 'bg-muted text-muted-foreground'
    },
};

function getMimeInfo(table: TableMeta): MimeInfos {
    const mime = table.mime;
    const key = table.key;

    for (const [pattern, info] of Object.entries(MIME_ICONS)) {
        if (pattern === 'default') continue;
        const match = matchPattern(pattern, mime);
        if (match) return typeof info === 'function' ? info(table) : info;
    }
    const def = MIME_ICONS['default'];
    return typeof def === 'function' ? (def as (t: TableMeta) => MimeInfos)(table) : def as MimeInfos;
}

/** Match a simple pattern: ^prefix, +contains, suffix$ */
function matchPattern(pattern: string, value: string): boolean {
    const startsWith = pattern.startsWith('^');
    const endsWith = pattern.endsWith('$');
    const core = pattern.slice(startsWith ? 1 : 0, endsWith ? -1 : undefined);
    if (startsWith && endsWith) return value === core;
    if (startsWith) return value.startsWith(core);
    if (endsWith) return value.endsWith(core);
    if (core.startsWith('+')) return value.includes(core);
    return value.includes(core);
}

const TABLES_PER_PAGE = 50;

interface TableCardProps {
    table: TableMeta;
    onDelete: () => void;
    t: (key: string) => string;
}

function TableCard({ table, onDelete, t }: TableCardProps) {
    const updated = new Date(table.updated_at).toLocaleString();
    const created = new Date(table.created_at).toLocaleString();
    const [downloading, setDownloading] = useState(false);
    const { icon, bg } = getMimeInfo(table);

    const handleDownload = async () => {
        setDownloading(true);
        const result = await downloadMyTable(table.key);
        setDownloading(false);
        if (!result) return;
        const blob = new Blob([result.buf], { type: result.mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className={cn(
            'rounded-lg border bg-card',
            'hover:border-primary/30 transition-colors'
        )}>
            <Accordion>
                <AccordionItem value="details" className="border-0">
                    <AccordionTrigger className="px-4 hover:no-underline hover:bg-accent/50 transition-colors items-center">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                'size-10 rounded-full flex items-center justify-center shrink-0',
                                bg
                            )}>
                                <Icon icon={icon} className="size-5" />
                            </div>
                            <div className="flex flex-col items-start text-left">
                                <div className="font-mono font-medium text-sm">{table.key}</div>
                                <div className="text-xs text-muted-foreground">
                                    {t('settings.tables.updated')} {updated}
                                </div>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 py-4">
                        <div className="rounded-md bg-muted/50 p-3 space-y-1.5 text-sm">
                            <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground">{t('settings.tables.mime')}</span>
                                <span className="font-mono text-xs">{table.mime}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground">{t('settings.tables.hash')}</span>
                                <span className="font-mono text-xs">{table.hash.slice(0, 16)}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground">{t('settings.tables.created')}</span>
                                <span className="text-xs">{created}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground">{t('settings.tables.updated')}</span>
                                <span className="text-xs">{updated}</span>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-3">
                            <Button size="sm" variant="outline" onClick={handleDownload} disabled={downloading}>
                                <Icon icon="material-symbols:download-rounded" className="size-4 mr-1.5" />
                                {t('settings.tables.download')}
                            </Button>
                            <Button size="sm" variant="destructive" onClick={onDelete}>
                                <Icon icon="material-symbols:delete-rounded" className="size-4 mr-1.5" />
                                {t('settings.tables.delete')}
                            </Button>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
}

export default function TablesPage() {
    const { t } = useTranslation();
    const { wellKnown } = useApi();
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get('q') ?? '';

    const [query, setQuery] = useState(initialQuery);
    const [tables, setTables] = useState<TableMeta[] | null>(null);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasLoaded, setHasLoaded] = useState(false);
    const [tableToDelete, setTableToDelete] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(null as unknown as ReturnType<typeof setTimeout>);

    const loadPage = useCallback(async (offset: number, filter?: string) => {
        setLoading(true);
        setError(null);
        try {
            // Wrap in wildcards for contains match (API uses * prefix/suffix for partial matching)
            const apiFilter = filter ? `*${filter}*` : undefined;
            const res = await listMyTables(TABLES_PER_PAGE, offset, apiFilter);
            setTotal(res.total);
            setTables(prev => {
                const existing = new Set((prev ?? []).map(t => t.key));
                const next = res.items.filter(t => !existing.has(t.key));
                return offset === 0 ? res.items : [...(prev ?? []), ...next];
            });
        } catch (e: any) {
            setError(e?.message ?? t('settings.tables.error_load'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    // Initial load
    useEffect(() => {
        if (!hasLoaded && wellKnown) { loadPage(0, initialQuery); setHasLoaded(true); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasLoaded, wellKnown]);

    // Debounced search: reset + reload on query change
    useEffect(() => {
        if (!hasLoaded || !wellKnown) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            const q = query.trim();
            const params = new URLSearchParams(searchParams);
            if (q) params.set('q', q);
            else params.delete('q');
            router.replace(`?${params.toString()}`, { scroll: false });
            setTables(null);
            setTotal(0);
            loadPage(0, q || undefined);
        }, 300);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query]);

    // Manual refresh
    const handleRefresh = () => {
        setTables(null);
        setTotal(0);
        loadPage(0, query.trim() || undefined);
    };

    const handleDelete = async () => {
        if (!tableToDelete) return;
        setDeleting(true);
        const ok = await deleteMyTable(tableToDelete);
        setDeleting(false);
        setTableToDelete(null);
        if (!ok) { setError(t('settings.tables.error_delete')); return; }
        setTables(prev => (prev ?? []).filter(t => t.key !== tableToDelete));
        setTotal(prev => prev - 1);
    };

    const hasMore = tables !== null && total > tables.length;

    const publicTables = (tables ?? []).filter(t => t.key.startsWith('public.'));
    const privateTables = (tables ?? []).filter(t => !t.key.startsWith('public.'));

    const renderList = (list: TableMeta[]) => (
        <div className="space-y-3">
            {list.map(table => (
                <TableCard key={table.key} table={table} onDelete={() => setTableToDelete(table.key)} t={t} />
            ))}
        </div>
    );

    const skeletons = (
        <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-lg border bg-card py-2.5 px-4">
                    <div className="flex items-center gap-3">
                        <Skeleton className="size-10 rounded-full shrink-0" />
                        <div className="flex-1 space-y-1.5">
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-3 w-28" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <>
            <PageTitle title={t('settings.tables.title')} />
            <SiteHeader
                children={t('settings.tables.title')}
                subtitle={t('settings.tables.description')}
                after={
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Icon
                                icon="material-symbols:search-rounded"
                                className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
                            />
                            <Input
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder={t('settings.tables.search_placeholder')}
                                className="pl-8 h-8 w-48 text-sm"
                            />
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={loading}
                            title={t('settings.tables.refresh')}
                        >
                            <Icon icon="material-symbols:refresh-rounded" className="size-5" />
                        </Button>
                    </div>
                }
            />

            <div className="p-4 md:p-6">
                {error && (
                    <div className="rounded-lg bg-destructive/10 p-4 text-destructive text-sm mb-6 flex items-center gap-2">
                        <Icon icon="material-symbols:error-rounded" className="size-4 shrink-0" />
                        {error}
                    </div>
                )}

                <div className="space-y-8">
                    {/* Public tables */}
                    <section className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-semibold">{t('settings.tables.public')}</h2>
                            {tables !== null && (
                                <span className="text-sm text-muted-foreground">{publicTables.length}</span>
                            )}
                        </div>
                        {tables === null
                            ? skeletons
                            : publicTables.length === 0
                                ? <EmptyBox>{t('settings.tables.no_public')}</EmptyBox>
                                : renderList(publicTables)
                        }
                    </section>

                    {/* Private tables */}
                    <section className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-semibold">{t('settings.tables.private')}</h2>
                            {tables !== null && (
                                <span className="text-sm text-muted-foreground">{privateTables.length}</span>
                            )}
                        </div>
                        {tables === null
                            ? skeletons
                            : privateTables.length === 0
                                ? <EmptyBox>{t('settings.tables.no_private')}</EmptyBox>
                                : renderList(privateTables)
                        }
                    </section>

                    {/* Load more */}
                    {hasMore && (
                        <div className="flex justify-center pt-2">
                            <Button
                                onClick={() => loadPage(tables!.length)}
                                disabled={loading}
                                variant="outline"
                            >
                                {loading ? t('settings.tables.loading') : t('settings.tables.load_more')}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Delete confirmation dialog */}
                <Dialog open={!!tableToDelete} onOpenChange={open => { if (!open) setTableToDelete(null); }}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t('settings.tables.delete_title')}</DialogTitle>
                            <DialogDescription>
                                {t('settings.tables.delete_confirm')}{' '}
                                <span className="font-mono text-foreground">{tableToDelete}</span>?
                                {' '}{t('settings.tables.delete_warning')}
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setTableToDelete(null)} disabled={deleting}>
                                {t('common.cancel')}
                            </Button>
                            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                                {deleting ? t('settings.tables.deleting') : t('common.delete')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
