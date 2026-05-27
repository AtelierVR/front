'use client';

import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from './config';

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  // Ensure i18n is initialised before rendering children on the client.
  const [ready, setReady] = useState(i18n.isInitialized);

  useEffect(() => {
    if (!i18n.isInitialized)
      i18n.on('initialized', () => setReady(true));
  }, []);

  useEffect(() => {
    const update = (lng: string) => { document.documentElement.lang = lng; };
    i18n.on('languageChanged', update);
    if (i18n.isInitialized) update(i18n.language);
    return () => { i18n.off('languageChanged', update); };
  }, []);

  if (!ready) return null;

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
