'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ResultItem {
    id: string;
    name: string;
    thumbnail: string | null;
    description: string | null;
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
    return (
        <Link
            href={result.redirect}
            className={cn(
                buttonVariants({ variant: 'outline' }),
                'block overflow-hidden relative hover:ring-3 hover:ring-primary/50 transition-all duration-200 aspect-[4/3] h-auto p-0',
            )}
        >
            <Image
                src={result.thumbnail ?? '/placeholder.png'}
                alt={result.name}
                width={400}
                height={300}
                className="w-full object-cover h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t dark:from-black/80 from-white/20 to-transparent flex flex-col justify-end p-4">
                <p className="font-bold text-lg">{result.name}</p>
                {result.description && (
                    <p className="text-sm text-muted-foreground">{result.description}</p>
                )}
            </div>
        </Link>
    );
}

// ── List item ─────────────────────────────────────────────────────────────────

export function ListItem(result: ResultItem) {
    return (
        <Link
            href={result.redirect}
            className={cn(
                buttonVariants({ variant: 'outline', size: 'default' }),
                'w-full justify-start h-auto py-3 px-6 flex items-center gap-4',
            )}
        >
            <Image
                src={result.thumbnail ?? '/placeholder.png'}
                alt={result.name}
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover"
            />
            <div>
                <p className="font-bold text-lg">{result.name}</p>
                {result.description && (
                    <p className="text-sm text-muted-foreground">{result.description}</p>
                )}
            </div>
        </Link>
    );
}
