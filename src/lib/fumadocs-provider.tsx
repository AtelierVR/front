'use client';

import { RootProvider } from 'fumadocs-ui/provider/next';
import { useEffect, useState } from 'react';
import i18n from '@/lib/i18n/config';
import { SUPPORTED_LANGS, LOCALE_NAMES, DEFAULT_LANG, TRANSLATIONS } from '@/lib/i18n/constants';

const LOCALES = SUPPORTED_LANGS.map((lang) => ({
  locale: lang,
  name: LOCALE_NAMES[lang] ?? lang,
}));

function normaliseLocale(lng: string): string {
  const short = lng.split('-')[0];
  return SUPPORTED_LANGS.includes(short) ? short : DEFAULT_LANG;
}

interface FumadocsProviderProps {
  children: React.ReactNode;
}

export function FumadocsProvider({ children }: FumadocsProviderProps) {
  const [locale, setLocale] = useState(() => normaliseLocale(i18n.language || DEFAULT_LANG));

  useEffect(() => {
    const handler = (lng: string) => setLocale(normaliseLocale(lng));
    i18n.on('languageChanged', handler);
    return () => i18n.off('languageChanged', handler);
  }, []);

  return (
    <RootProvider
      theme={{ enabled: false }}
      i18n={{
        locale,
        locales: LOCALES,
        translations: TRANSLATIONS,
        onLocaleChange: (lng) => {
          void i18n.changeLanguage(lng);
        },
      }}
    >
      {children}
    </RootProvider>
  );
}
