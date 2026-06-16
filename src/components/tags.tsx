'use client';

/**
 * Tag display handler system.
 *
 * Each handler matches tags by regex and returns a visual descriptor
 * (`TagDisplay`) or `null` to hide the tag entirely.
 *
 * Add new handlers to `TAG_HANDLERS` — order matters: first match wins.
 *
 * Country / language name lookups use preloaded maps (see `preloadMaps`).
 */

import { useEffect, useState, type ReactNode } from 'react';
import Image from 'next/image';
import { Countries } from '@/lib/countries';
import { Languages } from '@/lib/languages';
import { useTranslation } from 'react-i18next';

// ─── types ────────────────────────────────────────────────────────────────────

export interface TagDisplay {
    /** Icon: Iconify string, a ReactNode, or null to show no icon */
    icon?: ReactNode;
    /** Human-readable label shown next to the icon */
    label: string;
    /** Optional CSS background (e.g. "#e0f2fe" or a Tailwind class) */
    background?: string;
    /** Optional CSS text color */
    color?: string;
}

/** Return a TagDisplay to show the tag, or null to hide it. */
export type TagHandler = (raw: string, match: RegExpExecArray) => TagDisplay | null;

// ─── preloaded maps ───────────────────────────────────────────────────────────

// ─── built-in handlers ────────────────────────────────────────────────────────

/** Country tag: `usr:country_XX` */
function countryTagHandler(_raw: string, match: RegExpExecArray): TagDisplay | null {
    const { i18n } = useTranslation();
    let [label, setLabel] = useState<string | null>(null);
    let [icon, setIcon] = useState<string | null>(null);
    const code = match[1].toLowerCase();

    useEffect(() => {
        Countries.getById(code, i18n.language).then(e => {
            setLabel(e?.name ?? null);
            setIcon(e?.flag ?? null);
        }).catch(_ => { });
    }, [code, i18n.language]);

    return {
        icon: icon && <Image src={icon} alt={code} width={14} height={11} unoptimized className="h-3.5 w-auto rounded-sm" />,
        label: label ?? code.toUpperCase(),
        background: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    };
}

/** Language tag: `usr:lang_XX` */
function languageTagHandler(_raw: string, match: RegExpExecArray): TagDisplay | null {
    const { i18n } = useTranslation();
    let [label, setLabel] = useState<string | null>(null);
    let [icon, setIcon] = useState<string | null>(null);
    const code = match[1].toLowerCase();

    useEffect(() => {
        Languages.getById(code, i18n.language).then(e => {
            setLabel(e?.name ?? null);
            setIcon(e?.flag ?? null);
        }).catch(_ => { });
    }, [code, i18n.language]);

    return {
        icon: icon && <Image src={icon} alt={code} width={14} height={11} unoptimized className="h-3.5 w-auto rounded-sm" />,
        label: label ?? code.toUpperCase(),
        background: 'bg-violet-500/10 text-violet-700 dark:text-violet-400',
    };
}

// ─── registry ─────────────────────────────────────────────────────────────────

export const TAG_HANDLERS: Array<{ regex: RegExp; handler: TagHandler }> = [
    // Country
    { regex: /^usr:country_(\w+)$/, handler: countryTagHandler },
    // Language
    { regex: /^usr:lang_(\w+)$/, handler: languageTagHandler }
];

/** Default handler for unmatched tags. */
export const DEFAULT_TAG_HANDLER: TagHandler = (raw) => ({
    icon: 'material-symbols:tag-rounded',
    label: raw,
});

// ─── resolver ─────────────────────────────────────────────────────────────────

/**
 * Walk the handler chain and return the first non-null TagDisplay.
 * Falls back to `DEFAULT_TAG_HANDLER` if no handler matches.
 */
export function resolveTagDisplay(tag: string): TagDisplay | null {
    for (const { regex, handler } of TAG_HANDLERS) {
        const match = regex.exec(tag);
        if (match) return handler(tag, match);
    }
    return DEFAULT_TAG_HANDLER(tag, null!);
}
