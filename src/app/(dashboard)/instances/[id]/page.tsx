'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { getInstance } from '@/lib/api/instances';
import type { ApiInstance } from '@/types/api';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SiteHeader } from '@/components/site-header';

export default function InstanceDetailPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const { t } = useTranslation();

    const [instance, setInstance] = useState<ApiInstance | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | undefined>();

    const fetchInstance = useCallback(async () => {
        setLoading(true);
        setError(undefined);
        try {
            const data = await getInstance(params.id);
            setInstance(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load instance');
        } finally {
            setLoading(false);
        }
    }, [params.id]);

    useEffect(() => { void fetchInstance(); }, [fetchInstance]);

    const title = instance?.title || instance?.name || `Instance #${params.id}`;

    return (
        <>
            <SiteHeader
                before={
                    <Button variant="ghost" size="icon-sm" onClick={() => router.back()} aria-label="Back">
                        <Icon icon="material-symbols:arrow-back-rounded" className="size-4" />
                    </Button>
                }
                subtitle={instance ? <span className="font-mono text-xs">{instance.server}</span> : undefined}
                after={
                    <Button variant="ghost" size="icon-sm" onClick={() => void fetchInstance()} disabled={loading} aria-label="Refresh">
                        <Icon icon="material-symbols:refresh-rounded" className={loading ? 'animate-spin' : ''} />
                    </Button>
                }
            >
                {loading ? <Skeleton className="h-5 w-40" /> : title}
            </SiteHeader>

            <div className="flex flex-1 flex-col p-4 md:p-6 gap-4">
                {error && (
                    <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
                        <p className="text-sm text-destructive">{error}</p>
                    </div>
                )}

                {/* Info grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <InfoCard icon="material-symbols:tag-rounded" label="ID">
                        {loading ? <Skeleton className="h-4 w-12" /> : <span className="font-mono">{instance?.id}</span>}
                    </InfoCard>
                    <InfoCard icon="material-symbols:badge-rounded" label={t('admin.col_name')}>
                        {loading ? <Skeleton className="h-4 w-32" /> : <span className="font-mono">{instance?.name || '—'}</span>}
                    </InfoCard>
                    <InfoCard icon="material-symbols:title-rounded" label={t('admin.col_title')}>
                        {loading ? <Skeleton className="h-4 w-40" /> : <span>{instance?.title || '—'}</span>}
                    </InfoCard>
                    <InfoCard icon="material-symbols:public-rounded" label={t('admin.col_world')}>
                        {loading ? <Skeleton className="h-4 w-36" /> : <span className="font-mono text-xs break-all">{instance?.world || '—'}</span>}
                    </InfoCard>
                    <InfoCard icon="material-symbols:person-rounded" label={t('admin.col_owner')}>
                        {loading ? <Skeleton className="h-4 w-36" /> : <span className="font-mono text-xs break-all">{instance?.owner || '—'}</span>}
                    </InfoCard>
                    <InfoCard icon="material-symbols:group-rounded" label={t('admin.col_capacity')}>
                        {loading ? <Skeleton className="h-4 w-16" /> : (
                            <span>
                                {instance?.count ?? 0} / {instance?.capacity ?? '—'}
                            </span>
                        )}
                    </InfoCard>
                </div>

                {/* Connection */}
                {(loading || instance?.connection) && (
                    <div className="rounded-lg border p-4 flex flex-col gap-2">
                        <p className="text-sm font-medium">{t('admin.instance_connection')}</p>
                        {loading ? (
                            <Skeleton className="h-4 w-48" />
                        ) : instance?.connection ? (
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="capitalize">{instance.connection.method}</Badge>
                                <span className="font-mono text-xs text-muted-foreground break-all">{instance.connection.data}</span>
                            </div>
                        ) : null}
                    </div>
                )}

                {/* Tags */}
                {(loading || (instance?.tags && instance.tags.length > 0)) && (
                    <div className="rounded-lg border p-4 flex flex-col gap-2">
                        <p className="text-sm font-medium">{t('admin.instance_tags')}</p>
                        {loading ? (
                            <div className="flex gap-2">
                                <Skeleton className="h-5 w-16 rounded-full" />
                                <Skeleton className="h-5 w-12 rounded-full" />
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {instance!.tags.map(tag => (
                                    <Badge key={tag} variant="outline">{tag}</Badge>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Players link */}
                <Button
                    variant="outline"
                    className="w-full sm:w-auto self-start"
                    onClick={() => router.push(`/instances/${params.id}/players`)}
                    disabled={loading}
                >
                    <Icon icon="material-symbols:group-rounded" className="size-4 mr-2" />
                    {t('admin.instance_view_players')}
                    {!loading && instance && (
                        <Badge variant="secondary" className="ml-2">{instance.count}</Badge>
                    )}
                </Button>
            </div>
        </>
    );
}

function InfoCard({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
    return (
        <div className="rounded-lg border p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Icon icon={icon} className="size-3.5" />
                <span>{label}</span>
            </div>
            <div className="text-sm">{children}</div>
        </div>
    );
}
