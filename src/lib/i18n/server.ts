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

export async function getT() {
    const cookieStore = await cookies();
    const lang = cookieStore.get(COOKIE_NAME)?.value ?? DEFAULT_LANG;
    const translations = TRANSLATIONS[lang] ?? TRANSLATIONS[DEFAULT_LANG];

    return (key: string): string => getNestedValue(translations, key);
}

export async function getTranslations(): Promise<I18nResources> {
    const cookieStore = await cookies();
    const lang = cookieStore.get(COOKIE_NAME)?.value ?? DEFAULT_LANG;
    return TRANSLATIONS[lang] ?? TRANSLATIONS[DEFAULT_LANG];
}
