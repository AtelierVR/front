'use client';

/**
 * Shared pieces of the relay / instance auto-cleanup UI.
 *
 * A cleanup state is rendered the same way everywhere — `LifecycleBadges` in lists, `LifecycleSection`
 * on detail pages — from one place: fixed icon + tint per state, and the exact deadline only inside a
 * tooltip. Countdowns are always `mm:ss` in monospace (`tabular-nums`), like `Protocol`.
 */

import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

/** The API only ships the grace *reason* — its label lives under `<prefix><reason>`. */
export const RELAY_GRACE_KEYS = 'admin.relay_grace_';
export const INSTANCE_GRACE_KEYS = 'admin.instance_grace_';

/** Text tint per state — shared by the badges and by the detail rows so both stay in sync. */
export const PERSISTENT_TEXT = 'text-sky-700 dark:text-sky-400';
export const GRACE_TEXT = 'text-amber-700 dark:text-amber-400';
export const REMOVAL_TEXT = 'text-rose-700 dark:text-rose-400';

/** Outlined pill tints, one per cleanup state. */
export const PERSISTENT_CLASS = cn('border-sky-500/40 bg-sky-500/10', PERSISTENT_TEXT);
export const GRACE_CLASS = cn('border-amber-500/40 bg-amber-500/10', GRACE_TEXT);
export const REMOVAL_CLASS = cn('border-rose-500/40 bg-rose-500/10', REMOVAL_TEXT);

/** Icons, one per state (all verified against the Iconify Material Symbols set — a typo renders blank). */
export const PERSISTENT_ICON = 'material-symbols:keep-rounded';
export const GRACE_ICON = 'material-symbols:hourglass-top-rounded';
export const REMOVAL_ICON = 'material-symbols:auto-delete-rounded';

/** Time left as a `mm:ss` clock — minutes are not capped (`00:42`, `05:00`, `75:30`). */
export function formatTimer(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Seconds left until an epoch-ms deadline (0 once it is passed), or null when there is no deadline.
 * Ticks once a second only while a deadline is set.
 *
 * Returning raw seconds lets each call site decide what an expired deadline means: a grace period
 * that ran out must disappear at once, while a removal countdown may sit at 0 s until the entity is
 * actually gone.
 */
export function useRemaining(deadline: number | null): number | null {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (deadline === null) return;
        // No synchronous setState here: `now` starts at mount time and the first tick
        // (1 s later) picks up any drift, which is well below the displayed granularity.
        const id = setInterval(() => setNow(Date.now()), 1_000);
        return () => clearInterval(id);
    }, [deadline]);

    if (deadline === null) return null;
    return Math.max(0, Math.round((deadline - now) / 1000));
}

/** Countdown, always monospace — it inherits the surrounding size. */
export function Timer({ seconds }: { seconds: number }) {
    return <span className="font-mono tabular-nums">{formatTimer(seconds)}</span>;
}

/* ── State ───────────────────────────────────────────────────────────────── */

/** The relay and instance lifecycle unions are structurally identical — this is the common shape. */
export type LifecycleView =
    | { type: 'persistent' }
    | { type: 'grace'; key: string; expires: number }
    | { type: 'removal'; at: number };

interface LifecycleProps {
    lifecycle: LifecycleView | null;
    /** i18n prefix of the grace reason: {@link RELAY_GRACE_KEYS} or {@link INSTANCE_GRACE_KEYS}. */
    graceKeyPrefix: string;
}

/** Narrow the union once and derive the live countdowns the badges and rows both need. */
function useLifecycleView(lifecycle: LifecycleView | null) {
    const grace = lifecycle?.type === 'grace' ? lifecycle : null;
    const removal = lifecycle?.type === 'removal' ? lifecycle : null;
    const graceLeft = useRemaining(grace?.expires ?? null);
    const removalLeft = useRemaining(removal?.at ?? null);

    // Not `graceLeft > 0`: `graceLeft` is null when there is no deadline at all. A grace that ran out
    // client-side disappears at once instead of lingering at `00:00`.
    return { grace, removal, graceLeft, removalLeft, showGrace: grace !== null && graceLeft !== 0 };
}

/** `18:02:14` — the absolute deadline, only ever spelled out inside a tooltip. */
function formatDeadline(ms: number): string {
    return new Date(ms).toLocaleTimeString();
}

/** Tooltip body: the reason, then the exact deadline it refers to. */
function TooltipLines({ label, deadline }: { label: string; deadline?: number }) {
    return (
        <span className="flex flex-col">
            <span className="font-medium">{label}</span>
            {deadline !== undefined && <span className="opacity-70">{formatDeadline(deadline)}</span>}
        </span>
    );
}

/* ── Rendering ───────────────────────────────────────────────────────────── */

/** Outlined pill used for every cleanup badge; its tooltip carries the reason and the deadline. */
function LifecyclePill({ icon, className, tooltip, children }: { icon: string; className: string; tooltip: ReactNode; children: ReactNode }) {
    return (
        <Tooltip>
            <TooltipTrigger className="inline-flex">
                <Badge variant="outline" className={cn('text-xs gap-1 font-normal', className)}>
                    <Icon icon={icon} className="size-3 shrink-0" />
                    {children}
                </Badge>
            </TooltipTrigger>
            <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
    );
}

/** Tinted icon + text for a detail row — same states, same tooltips, no pill. */
function LifecycleStatus({ icon, className, tooltip, children }: { icon: string; className: string; tooltip: ReactNode; children: ReactNode }) {
    return (
        <Tooltip>
            <TooltipTrigger className={cn('inline-flex items-center gap-1.5', className)}>
                <Icon icon={icon} className="size-3.5 shrink-0" />
                <span>{children}</span>
            </TooltipTrigger>
            <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
    );
}

/**
 * Compact badges for lists.
 *
 * Renders nothing when there is nothing to report, so a list only ever advertises exceptions. A
 * timed state shows its countdown only; the reason lives in the tooltip, where a row is too narrow
 * for it. A relay can be persistent *and* in a grace period, hence the wrapping span.
 */
export function LifecycleBadges({ lifecycle, graceKeyPrefix, className }: LifecycleProps & { className?: string }) {
    const { t } = useTranslation();
    const { grace, removal, graceLeft, removalLeft, showGrace } = useLifecycleView(lifecycle);

    if (lifecycle === null) return null;
    if (lifecycle.type !== 'persistent' && !showGrace && removal === null) return null;

    return (
        <span className={cn('inline-flex flex-wrap items-center gap-1', className)}>
            {lifecycle.type === 'persistent' && (
                <LifecyclePill
                    icon={PERSISTENT_ICON}
                    className={PERSISTENT_CLASS}
                    tooltip={<TooltipLines label={t('admin.relay_persistent')} />}
                >
                    {t('admin.relay_persistent')}
                </LifecyclePill>
            )}
            {showGrace && grace !== null && (
                <LifecyclePill
                    icon={GRACE_ICON}
                    className={GRACE_CLASS}
                    tooltip={<TooltipLines label={t(graceKeyPrefix + grace.key)} deadline={grace.expires} />}
                >
                    <Timer seconds={graceLeft ?? 0} />
                </LifecyclePill>
            )}
            {removal !== null && (
                <LifecyclePill
                    icon={REMOVAL_ICON}
                    className={REMOVAL_CLASS}
                    tooltip={<TooltipLines label={t('admin.relay_removal')} deadline={removal.at} />}
                >
                    <Timer seconds={removalLeft ?? 0} />
                </LifecyclePill>
            )}
        </span>
    );
}

/**
 * Full lifecycle breakdown for a detail page — always rendered, em-dash when nothing is scheduled,
 * so the box never pops in and out of the layout.
 */
export function LifecycleSection({ lifecycle, graceKeyPrefix, loading }: LifecycleProps & { loading?: boolean }) {
    const { t } = useTranslation();
    const { grace, removal, graceLeft, removalLeft, showGrace } = useLifecycleView(lifecycle);

    // One state at a time, with its icon and tint; the timer only makes sense for the two timed
    // states. A `null` lifecycle leaves the row at its em-dash.
    const status: ReactNode = showGrace && grace !== null ? (
        <LifecycleStatus
            icon={GRACE_ICON}
            className={GRACE_TEXT}
            tooltip={<TooltipLines label={t(graceKeyPrefix + grace.key)} deadline={grace.expires} />}
        >
            {t('admin.relay_grace')} - {t(graceKeyPrefix + grace.key)}
            {graceLeft !== null && <> {t('admin.relay_during')} <Timer seconds={graceLeft} /></>}
        </LifecycleStatus>
    ) : lifecycle?.type === 'persistent' ? (
        <LifecycleStatus
            icon={PERSISTENT_ICON}
            className={PERSISTENT_TEXT}
            tooltip={<TooltipLines label={t('admin.relay_persistent')} />}
        >
            {t('admin.relay_persistent')}
        </LifecycleStatus>
    ) : removal !== null ? (
        <LifecycleStatus
            icon={REMOVAL_ICON}
            className={REMOVAL_TEXT}
            tooltip={<TooltipLines label={t('admin.relay_removal')} deadline={removal.at} />}
        >
            {t('admin.relay_removal')} {t('admin.relay_in')} <Timer seconds={removalLeft ?? 0} />
        </LifecycleStatus>
    ) : null;

    return (
        <div className="rounded-lg border border-border bg-accent/10 p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t('admin.relay_lifecycle')}</p>
            <div className="divide-y divide-border">
                <div className="flex items-start justify-between gap-4 py-1.5">
                    <span className="text-sm text-muted-foreground shrink-0">{t('admin.relay_status')}</span>
                    <span className="text-sm text-right break-all">
                        {loading ? <Skeleton className="h-4 w-24" /> : status ?? '—'}
                    </span>
                </div>
            </div>
        </div>
    );
}
