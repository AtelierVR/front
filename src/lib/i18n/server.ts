import { cookies } from 'next/headers';
import { COOKIE_NAME, DEFAULT_LANG, TRANSLATIONS } from './constants';
import type { I18nResources } from './constants';

function getNestedValue(obj: I18nResources, key: string): string {
    const parts = key.split('.');
    let current: I18nResources | string = obj;
    for (const part of parts) {
        if (typeof current !== 'object') return key;
        current = (current as I18nResources)[part];
        if (current === undefined) return key;
    }
    return typeof current === 'string' ? current : key;
}

/** Format options for i18n translations. */
export interface TOptions {
    /** Variable interpolation values, e.g. { query: "foo" } for "{{query}}" in the string. */
    [key: string]: string | number | boolean | undefined;
}

/** Interpolate {{variable}} placeholders in a string. */
function interpolate(value: string, options: TOptions): string {
    return value.replace(/\{\{(\w+)\}\}/g, (_, key) => {
        const v = options[key];
        return v !== undefined ? String(v) : `{{${key}}}`;
    });
}

/** Return the plural form of a translation string based on `count`.
 *
 * Supports i18next plural format:
 *   key_one  → used when count === 1
 *   key_other → fallback (used for count !== 1, or when key_one is absent)
 *
 * The raw `key` is returned as-is if neither form is found.
 */
function plural(value: string, count: number): string {
    const parts = value.split('\n');
    if (parts.length === 1) return value;

    const one = parts.find((p) => p.startsWith('key_one'));
    const other = parts.find((p) => p.startsWith('key_other')) ?? parts.find((p) => p.startsWith('key_many'));

    if (count === 1 && one) {
        return one.replace(/^key_one[=:]/, '').trim();
    }
    if (other) {
        return other.replace(/^(?:key_other|key_many)[=:]/, '').trim();
    }
    return value;
}

/** Build a TFunction bound to the correct language. */
function buildT(lang: string) {
    const translations = TRANSLATIONS[lang] ?? TRANSLATIONS[DEFAULT_LANG];

    return (key: string, options: TOptions = {}): string => {
        const raw = getNestedValue(translations, key);

        // Handle plural
        const { count, ...rest } = options;
        if (typeof count === 'number') {
            const formatted = plural(raw, count);
            return Object.keys(rest).length > 0 ? interpolate(formatted, rest) : formatted;
        }

        return Object.keys(rest).length > 0 ? interpolate(raw, rest) : raw;
    };
}

export async function getT() {
    const cookieStore = await cookies();
    const lang = cookieStore.get(COOKIE_NAME)?.value ?? DEFAULT_LANG;
    return buildT(lang);
}

export async function getTranslations(): Promise<I18nResources> {
    const cookieStore = await cookies();
    const lang = cookieStore.get(COOKIE_NAME)?.value ?? DEFAULT_LANG;
    return TRANSLATIONS[lang] ?? TRANSLATIONS[DEFAULT_LANG];
}
