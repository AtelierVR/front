import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { COOKIE_NAME, DEFAULT_LANG, RESOURCES, SUPPORTED_LANGS } from './constants';

if (!i18n.isInitialized) 
    i18n
        .use(LanguageDetector)
        .use(initReactI18next)
        .init({
            resources: RESOURCES,
            fallbackLng: DEFAULT_LANG,
            supportedLngs: SUPPORTED_LANGS,
            detection: {
                order: ['cookie', 'localStorage', 'navigator'],
                caches: ['cookie', 'localStorage'],
                lookupCookie: COOKIE_NAME,
                lookupLocalStorage: 'i18nextLng',
            },
            interpolation: { escapeValue: false },
        });

export default i18n;
