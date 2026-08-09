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
import Image from '@/components/NoxImage';
import { countriesService } from '@/lib/countries';
import { Languages } from '@/lib/languages';
import { useTranslation } from 'react-i18next';

// ─── types ────────────────────────────────────────────────────────────────────

export interface TagDisplay {
    /** Icon: Iconify string, a ReactNode, or null to show no icon */
    icon?: ReactNode;
    /** Human-readable label shown next to the icon (string or ReactNode) */
    label: ReactNode;
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
    const code = match[1].toLowerCase();
    return {
        icon: <CountryTagIcon code={code} />,
        label: <CountryTagLabel code={code} />,
        background: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    };
}

function CountryTagIcon({ code }: { code: string }) {
    const { i18n } = useTranslation();
    const [icon, setIcon] = useState<string | null>(null);
    useEffect(() => {
        countriesService.getById(code, i18n.language).then(e => {
            setIcon(e?.flags.svg ?? null);
        }).catch(() => {});
    }, [code, i18n.language]);
    if (!icon) return <span className="h-3.5 w-auto inline-block">{code.toUpperCase()}</span>;
    return <Image src={icon} alt={code} width={14} height={11} unoptimized className="h-3.5 w-auto rounded-sm" />;
}

function CountryTagLabel({ code }: { code: string }) {
    const { i18n } = useTranslation();
    const [label, setLabel] = useState<string | null>(null);
    useEffect(() => {
        countriesService.getById(code, i18n.language).then(e => {
            setLabel(e?.name.common ?? null);
        }).catch(() => {});
    }, [code, i18n.language]);
    return <>{label ?? code.toUpperCase()}</>;
}

/** Language tag: `usr:lang_XX` */
function languageTagHandler(_raw: string, match: RegExpExecArray): TagDisplay | null {
    const code = match[1].toLowerCase();
    return {
        icon: <LanguageTagIcon code={code} />,
        label: <LanguageTagLabel code={code} />,
        background: 'bg-violet-500/10 text-violet-700 dark:text-violet-400',
    };
}

function LanguageTagIcon({ code }: { code: string }) {
    const { i18n } = useTranslation();
    const [icon, setIcon] = useState<string | null>(null);
    useEffect(() => {
        Languages.getById(code, i18n.language).then(e => {
            setIcon(e?.flag ?? null);
        }).catch(() => {});
    }, [code, i18n.language]);
    if (!icon) return <span className="h-3.5 w-auto inline-block">{code.toUpperCase()}</span>;
    return <Image src={icon} alt={code} width={14} height={11} unoptimized className="h-3.5 w-auto rounded-sm" />;
}

function LanguageTagLabel({ code }: { code: string }) {
    const { i18n } = useTranslation();
    const [label, setLabel] = useState<string | null>(null);
    useEffect(() => {
        Languages.getById(code, i18n.language).then(e => {
            setLabel(e?.name ?? null);
        }).catch(() => {});
    }, [code, i18n.language]);
    return <>{label ?? code.toUpperCase()}</>;
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
