
import en from '@/messages/en.json';
import fr from '@/messages/fr.json';
import de from '@/messages/de.json';
import es from '@/messages/es.json';
import ja from '@/messages/ja.json';
import zh from '@/messages/zh.json';
import ru from '@/messages/ru.json';

export interface I18nResources {
    [key: string]: string | I18nResources;
}

export interface I18nResourcesRoot extends I18nResources {
    locale: string;
    language: string;
    cca: string;
}

const RAW_RESOURCES: I18nResourcesRoot[] = [en, fr, de, es, ja, zh, ru];

export const SUPPORTED_LANGS: string[] = RAW_RESOURCES.map((r) => r.locale);
export const DEFAULT_LANG: string = RAW_RESOURCES[0].locale;
export const RESOURCES: Record<string, { translation: I18nResourcesRoot }> = Object.fromEntries(RAW_RESOURCES.map((r) => [r.locale, { translation: r }]));
export const LOCALE_NAMES: Record<string, string> = Object.fromEntries(RAW_RESOURCES.map((r) => [r.locale, r.language]));
export const COOKIE_NAME = 'i18n_lang';
export const TRANSLATIONS: Record<string, I18nResources> = Object.fromEntries(RAW_RESOURCES.map((r) => [r.locale, r]));