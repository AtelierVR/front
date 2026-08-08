'use client';

import Link from 'next/link';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { resolveLocalized } from '@/lib/i18n/resolveLocalized';
import { resolveInstanceIcon } from '@/lib/useInstanceIcon';
import Image from '@/components/NoxImage';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ResultItem {
    id: string;
    /** Plain string or locale→string map. Resolved at render time via resolveLocalized. */
    name: string | Record<string, string>;
    /** Plain URL, theme-keyed map (e.g. { default, light }), or null. Resolved at render time via resolveInstanceIcon. */
    thumbnail: string | Record<string, string> | null;
    /** Plain string, locale→string map, or null. Resolved at render time via resolveLocalized. */
    description: string | Record<string, string> | null;
    redirect: string;
}

// ── Layout wrappers ───────────────────────────────────────────────────────────

export function ResultGrid({ children }: { children: React.ReactNode }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {children}
        </div>
    );
}

export function ResultList({ children }: { children: React.ReactNode }) {
    return <div className="flex flex-col gap-4">{children}</div>;
}

// ── Skeletons ─────────────────────────────────────────────────────────────────

export function SkeletonGrid({ count = 8 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <Skeleton key={i} className="h-36 w-full rounded-lg aspect-[4/3]" />
            ))}
        </div>
    );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
    return (
        <div className="flex flex-col gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
        </div>
    );
}

// ── Empty / error state ───────────────────────────────────────────────────────

export function EmptyState({ label, details }: { label: string; details?: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
            <Icon icon="material-symbols:search-rounded" className="h-10 w-10 mb-4 opacity-30" />
            <p>{label}</p>
            {details && <p className="mt-2 text-sm text-muted-foreground">{details}</p>}
        </div>
    );
}

/** Dashed border box for empty states — matches the style used in UserFavorites. */
export function EmptyBox({ children }: { children: React.ReactNode }) {
    return (
        <div className="text-center text-muted-foreground border border-dashed rounded-xl py-12">
            {children}
        </div>
    );
}

// ── Pagination ────────────────────────────────────────────────────────────────

export function PageNav({
    page,
    total,
    limit,
    onPage,
}: {
    page: number;
    total: number;
    limit: number;
    onPage: (p: number) => void;
}) {
    const { t } = useTranslation();
    const totalPages = Math.max(1, Math.ceil(total / limit));
    if (totalPages <= 1) return null;
    return (
        <div className="flex items-center justify-center gap-2 mt-8">
            <Button variant="outline" size="sm" onClick={() => onPage(page - 1)} disabled={page <= 1}>
                {t('common.back')}
            </Button>
            <span className="text-sm text-muted-foreground">
                {page} / {totalPages}
            </span>
            <Button variant="outline" size="sm" onClick={() => onPage(page + 1)} disabled={page >= totalPages}>
                {t('common.next')}
            </Button>
        </div>
    );
}

// ── Card item ─────────────────────────────────────────────────────────────────

export function CardItem(result: ResultItem) {
    const { i18n } = useTranslation();
    const { resolvedTheme } = useTheme();
    const name = resolveLocalized(result.name, i18n.language) || '';
    const thumbnail = resolveInstanceIcon(result.thumbnail, resolvedTheme);
    const desc = resolveLocalized(result.description, i18n.language) || null;

    return (
        <Link
            href={result.redirect}
            className={cn(
                buttonVariants({ variant: 'outline' }),
                'block overflow-hidden relative hover:ring-3 hover:ring-primary/50 transition-all duration-200 aspect-[4/3] h-auto p-0',
            )}
        >
            <Image
                src={thumbnail ?? ''}
                alt={name}
                width={400}
                height={300}
                className="w-full object-cover h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t dark:from-black/80 from-white/20 to-transparent flex flex-col justify-end p-4">
                <p className="font-bold text-lg">{name}</p>
                {desc && (
                    <p className="text-sm text-muted-foreground">{desc}</p>
                )}
            </div>
        </Link>
    );
}

// ── List item ─────────────────────────────────────────────────────────────────

export function ListItem(result: ResultItem) {
    const { i18n } = useTranslation();
    const { resolvedTheme } = useTheme();
    const name = resolveLocalized(result.name, i18n.language) || '';
    const thumbnail = resolveInstanceIcon(result.thumbnail, resolvedTheme);
    const desc = resolveLocalized(result.description, i18n.language) || null;

    return (
        <Link
            href={result.redirect}
            className={cn(
                buttonVariants({ variant: 'outline', size: 'default' }),
                'w-full justify-start h-auto py-3 px-6 flex items-center gap-4',
            )}>
            <Image
                src={thumbnail ?? ''}
                alt={name}
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover"
            />
            <div>
                <p className="font-bold text-lg">{name}</p>
                {desc && <p className="text-sm text-muted-foreground">{desc}</p>}
            </div>
        </Link>
    );
}
