'use client';

import { type ComponentProps } from 'react';
import { AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export interface AvatarLetterProps extends ComponentProps<'span'> {
    /** Name/title used to derive the letter(s). */
    name?: string | null;
    /** Number of leading characters to keep (uppercased). Defaults to 1. */
    length?: number;
    /** Shown when `name` is empty. Defaults to `'?'`. */
    placeholder?: string;
}

/**
 * The letter content rendered inside an avatar fallback.
 * Derives the initial(s) from a name (`name.slice(0, length).toUpperCase()`).
 */
export function AvatarLetter({
    name,
    length = 1,
    placeholder = '?',
    className,
    children,
    ...props
}: AvatarLetterProps) {
    const clean = (name ?? '').trim();
    const value = clean ? clean.slice(0, Math.max(1, length)).toUpperCase() : placeholder;

    return (
        <span className={cn('font-semibold select-none', className)} {...props}>
            {children ?? value}
        </span>
    );
}

export interface AvatarLetterFallbackProps extends ComponentProps<typeof AvatarFallback> {
    /** Name/title used to derive the displayed letter(s). */
    name?: string | null;
    /** Number of leading characters to keep (uppercased). Defaults to 1. */
    length?: number;
    /** Shown when `name` is empty. Defaults to `'?'`. */
    placeholder?: string;
    /** Extra classes for the inner letter `<span>` (e.g. `text-lg` for large avatars). */
    letterClassName?: string;
}

/**
 * `<AvatarFallback>` that renders the initial(s) of a name.
 *
 * Standardises the avatar fallback used across the app.
 *
 * @example
 * <Avatar className="h-12 w-12">
 *   {thumbnail && <AvatarImage src={thumbnail} alt={name} />}
 *   <AvatarLetterFallback name={name} letterClassName="text-lg" />
 * </Avatar>
 */
export function AvatarLetterFallback({
    name,
    length,
    placeholder = '?',
    className,
    letterClassName,
    children,
    ...props
}: AvatarLetterFallbackProps) {
    return (
        <AvatarFallback className={className} {...props}>
            {children ?? (
                <AvatarLetter
                    name={name}
                    length={length}
                    placeholder={placeholder}
                    className={letterClassName}
                />
            )}
        </AvatarFallback>
    );
}
