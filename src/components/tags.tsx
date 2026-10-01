'use client';

/**
 * Tag display handler system.
 *
 * Each handler matches tags by regex and returns a visual descriptor
 * (`TagDisplay`) or `null` to hide the tag entirely.
 *
 * Add new handlers to `TAG_HANDLERS` — order matters: first match wins.
 *
 * Regexes must mirror the backend (`node/src/common/tags.ts` +
 * `node/src/users/user.model.ts`): a tag is `<namespace>:<value>` where the value is
 * `[a-z][a-z0-9_]*`, and most flags are looked up with `Tags.ALL` (any namespace)
 * rather than a hardcoded `usr:`.
 *
 * Country / language name lookups use preloaded maps (see `preloadMaps`).
 */

import { useEffect, useState, type ReactNode } from 'react';
import Image from '@/components/NoxImage';
import { countriesService } from '@/lib/countries';
import { Languages } from '@/lib/languages';
import { isHiddenTag } from '@/lib/utils';
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

// ─── static handlers ──────────────────────────────────────────────────────────

/** Label rendered from an i18n key (handlers are plain functions, so they cannot use hooks). */
function TagLabel({ i18nKey }: { i18nKey: string }) {
    const { t } = useTranslation();
    return <>{t(i18nKey)}</>;
}

/** Handler for a single, fully-known tag (`usr:developer`, `sys:whitelist`…). */
function simpleTagHandler(icon: string, i18nKey: string, background: string): TagHandler {
    return () => ({ icon, label: <TagLabel i18nKey={i18nKey} />, background });
}

// ─── registry ─────────────────────────────────────────────────────────────────

export const TAG_HANDLERS: Array<{ regex: RegExp; handler: TagHandler }> = [
    // Country preference — `usr:country_<iso3166-1 alpha-2>`
    { regex: /^usr:country_([a-z0-9_]+)$/, handler: countryTagHandler },
    // Language preference — `usr:lang_<iso639-1>`
    { regex: /^usr:lang_([a-z0-9_]+)$/, handler: languageTagHandler },

    // Account preferences — resolved with `Tags.ALL` on the backend, so a `usr:`
    // or `sys:` namespace is equally valid for every one of these values.
    { regex: /^(?:usr|sys):manual_follow$/, handler: simpleTagHandler('material-symbols:how-to-reg-rounded', 'tags.manual_follow', 'bg-amber-500/10 text-amber-700 dark:text-amber-400') },
    { regex: /^(?:usr|sys):auto_reject_follow$/, handler: simpleTagHandler('material-symbols:block-rounded', 'tags.auto_reject_follow', 'bg-rose-500/10 text-rose-700 dark:text-rose-400') },
    { regex: /^(?:usr|sys):hide_followers$/, handler: simpleTagHandler('material-symbols:visibility-off-rounded', 'tags.hide_followers', 'bg-slate-500/10 text-slate-700 dark:text-slate-400') },
    { regex: /^(?:usr|sys):hide_following$/, handler: simpleTagHandler('material-symbols:visibility-off-rounded', 'tags.hide_following', 'bg-slate-500/10 text-slate-700 dark:text-slate-400') },
    { regex: /^(?:usr|sys):no_discover$/, handler: simpleTagHandler('material-symbols:search-off-rounded', 'tags.no_discover', 'bg-slate-500/10 text-slate-700 dark:text-slate-400') },

    // Instance state — built with `Tags.SYSTEM` (`sys:`) by `instances.service.ts`.
    { regex: /^sys:unlimited$/, handler: simpleTagHandler('material-symbols:all-inclusive-rounded', 'tags.unlimited', 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400') },
    { regex: /^sys:whitelist$/, handler: simpleTagHandler('material-symbols:playlist-add-check-rounded', 'tags.whitelist', 'bg-teal-500/10 text-teal-700 dark:text-teal-400') },
    { regex: /^sys:password$/, handler: simpleTagHandler('material-symbols:lock-rounded', 'tags.password', 'bg-orange-500/10 text-orange-700 dark:text-orange-400') },
    // `persistent` is resolved with `Tags.MODERATION` (`adm:`/`sys:`/`dft:`), but only
    // `sys:` survives `isHiddenTag`.
    { regex: /^sys:persistent$/, handler: simpleTagHandler('material-symbols:push-pin-rounded', 'tags.persistent', 'bg-purple-500/10 text-purple-700 dark:text-purple-400') },

    // Advanced mode — purely a frontend preference, always written as `usr:developer`
    // (see `useDeveloperMode`). Deliberately `usr:`-only so a stray `sys:developer`
    // cannot advertise the badge without actually enabling advanced mode.
    { regex: /^usr:developer$/, handler: simpleTagHandler('material-symbols:code-rounded', 'tags.developer', 'bg-sky-500/10 text-sky-700 dark:text-sky-400') },
];

/**
 * Fallback used for tags that no handler matches. It is only rendered in advanced
 * mode (`usr:developer`) — unknown tags are hidden by default.
 */
export const DEFAULT_TAG_HANDLER: TagHandler = (raw) => ({
    icon: 'material-symbols:tag-rounded',
    label: raw,
});

// ─── resolver ─────────────────────────────────────────────────────────────────

export interface TagDisplayOptions {
    /** Advanced mode (`usr:developer`): also display tags with no known handler. */
    advanced?: boolean;
}

/**
 * Walk the handler chain and return the first matching `TagDisplay`.
 *
 * Tags with no handler are **hidden** unless `advanced` is set. Internal
 * namespaces (`dft:`, `adm:`) are never displayed.
 */
export function resolveTagDisplay(tag: string, options: TagDisplayOptions = {}): TagDisplay | null {
    if (isHiddenTag(tag)) return null;

    for (const { regex, handler } of TAG_HANDLERS) {
        const match = regex.exec(tag);
        if (match) return handler(tag, match);
    }

    return options.advanced ? DEFAULT_TAG_HANDLER(tag, null!) : null;
}
