
import en from '@/messages/en.json';
import fr from '@/messages/fr.json';
import de from '@/messages/de.json';
import es from '@/messages/es.json';
import jp from '@/messages/jp.json';

export let RESOURCES = {
    en: { translation: en },
    fr: { translation: fr },
    de: { translation: de },
    es: { translation: es },
    jp: { translation: jp },
}

export const DEFAULT_LANG = Object.keys(RESOURCES)[0];
export const SUPPORTED_LANGS = Object.keys(RESOURCES);
export const COOKIE_NAME = 'i18nextLng';
