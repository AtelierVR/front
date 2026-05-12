'use client';

import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useRelayInstance } from './instance-context';

export default function RelayInstanceDetailPage() {
    const { instance, loading } = useRelayInstance();
    const { t } = useTranslation();

    return (
        <div className="flex flex-col gap-4">
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
                        <span>{instance?.count ?? 0} / {instance?.capacity ?? '—'}</span>
                    )}
                </InfoCard>
            </div>

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
        </div>
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
