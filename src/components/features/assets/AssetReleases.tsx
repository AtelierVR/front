'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AvatarLetter } from '@/components/ui/avatar-letter-fallback';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';
import { getReleaseFiles, getReleases } from '@/lib/api/releases';
import { getUser } from '@/lib/api/users';
import { assetEndpoint } from '@/lib/api/assets';
import { useApi } from '@/lib/api';
import { ENGINES, PLATFORMS, formatSize } from '@/lib/platform';
import { cn } from '@/lib/utils';
import { formatNoxId, NoxIdentifier } from '@/types/nox-identifier';
import { releaseVersion } from '@/types/api';
import type {
    ApiAsset,
    ApiProcessProgress,
    ApiProcessState,
    ApiReleaseChannel,
    ApiReleaseFile,
    ApiReleaseItem,
    ApiUser,
} from '@/types/api';

/**
 * Changelog of an asset: every release with its notes and its files, newest
 * first. Shared by the `/m`, `/w` and `/a` pages — the asset itself is the only
 * input, its endpoint is read from the instance config.
 */

export interface AssetReleasesProps {
    /** Asset whose releases are listed. */
    asset: ApiAsset;
    /** Shown when the asset has no release at all. */
    emptyLabel?: string;
    /** Releases per page. */
    pageSize?: number;
    className?: string;
}

/** Changelogs longer than this are collapsed behind a "show more" button. */
const CLAMP_LENGTH = 800;

/**
 * Channel colours: `stable` ships to everyone, `candidate` is a beta and
 * `nightly` is an early alpha. Used for the card's top border and the badge.
 */
const CHANNEL_STYLES: Record<ApiReleaseChannel, { border: string; badge: string }> = {
    stable: {
        border: 'border-t-emerald-500 dark:border-t-emerald-400',
        badge: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    },
    candidate: {
        border: 'border-t-amber-500 dark:border-t-amber-400',
        badge: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    },
    nightly: {
        border: 'border-t-rose-500 dark:border-t-rose-400',
        badge: 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300',
    },
};

function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

function stateOf(state: ApiProcessState): {
    key: string;
    pending: boolean;
    progress: ApiProcessProgress | null;
} {
    if (typeof state === 'string')
        return { key: state, pending: state !== 'completed', progress: null };
    return {
        key: state.status,
        pending: state.status !== 'completed',
        progress: state.progress,
    };
}

function attributeOf(file: ApiReleaseFile, key: string): string | null {
    const entry = file.attributes.find(
        (attribute) => attribute.key.toLowerCase() === key,
    );
    return entry && typeof entry.value === 'string' ? entry.value : null;
}

function downloadUrl(file: ApiReleaseFile): string | null {
    const { url } = file;
    if (typeof url === 'string') return url || null;
    return url?.proxified ?? url?.original ?? null;
}

/**
 * Uploader of a file, when it can be shown: the API stores whatever identifier
 * was sent with the upload, so it may be empty, malformed, or of another kind.
 */
function uploaderOf(file: ApiReleaseFile): string | null {
    if (typeof file.uploader !== 'string') return null;
    const identifier = NoxIdentifier.parse(file.uploader);
    return identifier.isValid() && identifier.compatible('u')
        ? file.uploader
        : null;
}

/** Uploader of a file, resolved to its profile when it is a known user. */
function UploaderChip({ noxRef }: { noxRef: string }) {
    const [user, setUser] = useState<ApiUser | undefined | null>(undefined);
    const { wellKnown } = useApi();
    const address = wellKnown?.address ?? '::';

    useEffect(() => {
        let cancelled = false;
        getUser(noxRef)
            .then((value) => { if (!cancelled) setUser(value); })
            .catch(() => { if (!cancelled) setUser(null); });
        return () => { cancelled = true; };
    }, [noxRef]);

    const displayName = user ? user.display || user.username : null;
    const label = displayName ?? formatNoxId(noxRef, address);

    return (
        <Link
            href={`/u/${formatNoxId(noxRef, address)}`}
            className="group flex items-center gap-1.5 no-underline"
        >
            <Avatar className="size-5 shrink-0">
                {user?.thumbnail && <AvatarImage src={user.thumbnail} alt={label} />}
                <AvatarFallback className="bg-primary/10 text-[10px]">
                    {user === undefined ? null : displayName ? (
                        <AvatarLetter name={displayName} />
                    ) : (
                        <Icon icon="material-symbols:person-rounded" className="size-3 text-muted-foreground" />
                    )}
                </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground group-hover:underline">{label}</span>
        </Link>
    );
}

function ChannelBadge({ channel }: { channel: ApiReleaseChannel }) {
    const { t } = useTranslation();
    const style = CHANNEL_STYLES[channel] ?? CHANNEL_STYLES.stable;

    return (
        <Badge variant="outline" className={cn('text-xs font-normal', style.badge)}>
            {t(`releases.channel.${channel}`, { defaultValue: channel })}
        </Badge>
    );
}

const STATUS_ICONS: Record<string, string> = {
    awaiting: 'material-symbols:schedule-rounded',
    queued: 'material-symbols:hourglass-top-rounded',
    processing: 'material-symbols:progress-activity',
    failed: 'material-symbols:error-rounded',
};

function StatusBadge({ state }: { state: ApiProcessState }) {
    const { t } = useTranslation();
    const { key, pending, progress } = stateOf(state);
    if (!pending) return null;
    const label = t(`releases.status.${key}`, { defaultValue: key });
    const steps = progress ? ` ${progress.current}/${progress.total}` : '';

    return (
        <Badge
            variant="outline"
            className={cn(
                'text-xs font-normal',
                key === 'failed' ? 'border-destructive/40 text-destructive' : 'text-muted-foreground',
            )}
        >
            <Icon
                icon={STATUS_ICONS[key] ?? 'material-symbols:progress-activity'}
                className={key === 'processing' ? 'animate-spin' : undefined}
            />
            {label}
            {steps}
        </Badge>
    );
}

function ReleaseFileRow({ file }: { file: ApiReleaseFile }) {
    const { t } = useTranslation();
    const platform = attributeOf(file, 'platform');
    const engine = attributeOf(file, 'engine');
    const platformInfo = platform ? PLATFORMS[platform.toLowerCase()] : undefined;
    const engineInfo = engine ? ENGINES[engine.split(':')[0].toLowerCase()] : undefined;
    const { pending } = stateOf(file.status);
    const url = downloadUrl(file);
    // The API stores whatever identifier was sent with the upload: an invalid
    // one is not linkable, so it is simply not shown.
    const uploader = uploaderOf(file);
    const label = file.name ?? file.mime;
    const downloadable = url !== null && !pending;

    return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5 first:pt-0 last:pb-0">
            <div className="flex min-w-0 flex-1 items-center">
                {downloadable ? (
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={label}
                        className="truncate text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                        {label}
                    </a>
                ) : (
                    <span className="truncate text-sm font-medium" title={label}>
                        {label}
                    </span>
                )}
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {platformInfo && (
                    <span className="hidden items-center gap-1.5 sm:flex">
                        <Icon icon={platformInfo.icon} className="size-3.5" style={{ color: platformInfo.color }} />
                        {t(platformInfo.label)}
                    </span>
                )}
                {(engineInfo ?? engine) && (
                    <span className="hidden items-center gap-1.5 sm:flex">
                        {engineInfo && (
                            <Icon icon={engineInfo.icon} className="size-3.5" style={{ color: engineInfo.color }} />
                        )}
                        {engineInfo ? t(engineInfo.label) : engine}
                    </span>
                )}
                <span>{formatSize(file.size)}</span>
            </div>

            {uploader && <UploaderChip noxRef={uploader} />}

            <StatusBadge state={file.status} />
        </div>
    );
}

function ReleaseCard({
    release,
    files,
    filesLoading,
    isPreferred,
}: {
    release: ApiReleaseItem;
    files: ApiReleaseFile[] | null;
    filesLoading: boolean;
    isPreferred: boolean;
}) {
    const { t } = useTranslation();
    const [expanded, setExpanded] = useState(false);

    const changelog = release.changelog?.trim() ?? '';
    const clamp = changelog.length > CLAMP_LENGTH;
    const collapsed = clamp && !expanded;
    const channel = CHANNEL_STYLES[release.channel] ?? CHANNEL_STYLES.stable;

    return (
        <Card className={cn('overflow-hidden rounded-t-xl border-t-4 py-0', channel.border)}>
            <CardHeader className="gap-2 border-b border-border/60 bg-muted/30 py-3">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
                    <span className="font-heading text-base font-semibold">{release.name}</span>
                    {release.title && (
                        <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                            {release.title}
                        </span>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                        <ChannelBadge channel={release.channel} />
                        {isPreferred && (
                            <Badge className="gap-1 text-xs font-normal" variant="secondary">
                                <Icon icon="material-symbols:star-rounded" />
                                {t('releases.recommended')}
                            </Badge>
                        )}
                        <StatusBadge state={release.status} />
                        {release.created_at !== undefined && (
                            <span className="text-xs text-muted-foreground">
                                {formatDate(release.created_at)}
                            </span>
                        )}
                    </div>
                </div>
            </CardHeader>

            {/* The card's own padding is removed so the header can sit flush:
                the vertical spacing of the body has to be added back here. */}
            <CardContent className="space-y-4 pb-4">
                {changelog ? (
                    <>
                        <div className={cn('relative', collapsed && 'max-h-64 overflow-hidden')}>
                            <MarkdownRenderer content={changelog} />
                            {collapsed && (
                                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card to-transparent" />
                            )}
                        </div>
                        {clamp && (
                            <Button
                                variant="ghost"
                                size="xs"
                                onClick={() => setExpanded((value) => !value)}
                            >
                                <Icon icon={collapsed ? 'material-symbols:expand-more-rounded' : 'material-symbols:expand-less-rounded'} />
                                {t(collapsed ? 'releases.show_more' : 'releases.show_less')}
                            </Button>
                        )}
                    </>
                ) : (
                    <p className="text-sm italic text-muted-foreground">{t('releases.no_changelog')}</p>
                )}

                {(filesLoading || (files?.length ?? 0) > 0) && (
                    <div>
                        <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {t('releases.files')}
                        </div>
                        {filesLoading ? (
                            <div className="space-y-2 py-2">
                                {[0, 1].map((index) => (
                                    <Skeleton key={index} className="h-8 w-full" />
                                ))}
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {(files ?? []).map((file) => (
                                    <ReleaseFileRow key={file.id} file={file} />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function AssetReleasesSkeleton({ count = 2 }: { count?: number }) {
    return (
        <div className="space-y-4">
            {Array.from({ length: count }, (_, index) => (
                <Card key={index} className="py-0">
                    <div className="flex items-center gap-2 border-b border-border/60 bg-muted/30 px-4 py-3">
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="ml-auto h-4 w-24" />
                    </div>
                    <div className="space-y-2 px-4 py-4">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-4/5" />
                        <Skeleton className="h-8 w-full" />
                    </div>
                </Card>
            ))}
        </div>
    );
}

export function AssetReleases({
    asset,
    emptyLabel,
    pageSize = 10,
    className,
}: AssetReleasesProps) {
    const { t } = useTranslation();
    const { config } = useApi();
    const endpoint = assetEndpoint(config, asset);
    const preferredRelease = releaseVersion(asset.release);
    const [releases, setReleases] = useState<ApiReleaseItem[] | null>(null);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(false);
    const [files, setFiles] = useState<Record<number, ApiReleaseFile[]>>({});
    const [filesLoading, setFilesLoading] = useState<readonly number[]>([]);

    /** Loads a page of releases, replacing (`offset === 0`) or appending. */
    const load = useCallback(
        async (offset: number, signal: { cancelled: boolean }) => {
            if (!endpoint) return;
            if (offset === 0) setLoading(true);
            else setLoadingMore(true);
            try {
                const page = await getReleases(endpoint, asset.id, { limit: pageSize, offset });
                if (signal.cancelled) return;
                setTotal(page.total);
                setReleases((current) =>
                    offset === 0 ? page.items : [...(current ?? []), ...page.items],
                );
                setError(false);
            } catch {
                if (!signal.cancelled) setError(true);
            } finally {
                if (!signal.cancelled) {
                    setLoading(false);
                    setLoadingMore(false);
                }
            }
        },
        [endpoint, asset.id, pageSize],
    );

    useEffect(() => {
        const signal = { cancelled: false };
        setReleases(null);
        setFiles({});
        void load(0, signal);
        return () => { signal.cancelled = true; };
    }, [load]);

    // Files of the loaded releases, fetched release by release.
    useEffect(() => {
        if (!endpoint || !releases) return;
        const missing = releases.filter((release) => files[release.id] === undefined);
        if (missing.length === 0) return;

        const signal = { cancelled: false };
        setFilesLoading((current) => [...current, ...missing.map((release) => release.id)]);

        void Promise.all(
            missing.map(async (release) => {
                try {
                    const page = await getReleaseFiles(endpoint, asset.id, release.id);
                    if (signal.cancelled) return;
                    setFiles((current) => ({ ...current, [release.id]: page.items }));
                } catch {
                    if (signal.cancelled) return;
                    setFiles((current) => ({ ...current, [release.id]: [] }));
                } finally {
                    if (!signal.cancelled)
                        setFilesLoading((current) => current.filter((id) => id !== release.id));
                }
            }),
        );

        return () => { signal.cancelled = true; };
    }, [releases, files, endpoint, asset.id]);

    // The config tells which endpoint serves the kind: wait for it, then give up
    // cleanly if the instance does not serve the asset's kind.
    if (!config) 
        return <AssetReleasesSkeleton />;

    if (!endpoint)
        return (
            <div className="rounded-xl border border-dashed py-12 text-center text-muted-foreground">
                {emptyLabel ?? t('releases.empty')}
            </div>
        );

    if (loading) 
        return <AssetReleasesSkeleton />;

    if (error && (!releases || releases.length === 0))
        return (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-12 text-center">
                <p className="text-sm text-muted-foreground">{t('releases.load_error')}</p>
                <Button variant="outline" size="sm" onClick={() => void load(0, { cancelled: false })}>
                    <Icon icon="material-symbols:refresh-rounded" />
                    {t('releases.retry')}
                </Button>
            </div>
        );

    if (!releases || releases.length === 0)
        return (
            <div className="rounded-xl border border-dashed py-12 text-center text-muted-foreground">
                {emptyLabel ?? t('releases.empty')}
            </div>
        );

    const hasMore = releases.length < total;

    return (
        <div className={cn('space-y-4', className)}>
            {releases.map((release) => (
                <ReleaseCard
                    key={release.id}
                    release={release}
                    files={files[release.id] ?? null}
                    filesLoading={filesLoading.includes(release.id)}
                    isPreferred={release.id === preferredRelease}
                />
            ))}

            {hasMore && (
                <div className="flex justify-center pt-2">
                    <Button
                        variant="outline"
                        disabled={loadingMore}
                        onClick={() => void load(releases.length, { cancelled: false })}
                    >
                        {loadingMore ? (
                            <Icon icon="material-symbols:progress-activity" className="animate-spin" />
                        ) : (
                            <Icon icon="material-symbols:expand-more-rounded" />
                        )}
                        {t('releases.load_more')}
                    </Button>
                </div>
            )}
        </div>
    );
}
