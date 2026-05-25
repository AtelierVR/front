'use client';

import { useApi } from './api';
import { useTranslation } from 'react-i18next';
import { resolveLocalized } from './i18n/resolveLocalized';
import { InstanceLogo } from '@/components/layout/InstanceLogo';

export function baseOptions() {
  const API = useApi();
  const { i18n } = useTranslation();

  const meta = API.wellKnown?.metadata;
  const name = resolveLocalized(meta?.title, i18n.language) || 'Nox';

  return {
    nav: {
      title: (
        <>
          <InstanceLogo className="h-5 w-5" />
          {name}
        </>
      ),
    },
    searchToggle: { enabled: false },
    themeSwitch: { enabled: false },
    slots: { languageSelect: false as const },
    userItem: { url: '/profile' },
    links: [],
  };
}
