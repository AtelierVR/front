'use client';

import { useApi } from './api';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useTranslation } from 'react-i18next';
import { resolveLocalized } from './i18n/resolveLocalized';
import { InstanceLogo } from '@/components/layout/InstanceLogo';
import { Icon } from '@iconify/react';

export const featureIcons: Record<string, string> = {
  user: 'material-symbols:person-rounded',
  world: 'material-symbols:public',
  avatar: 'material-symbols:accessibility-new-rounded',
  instance: 'material-symbols:location-on-rounded',
  server: 'material-symbols:dns',
};

export type UserNavItem =
  | { type: 'link'; icon: string; label: string; href: string; size?: [number, number] }
  | { type: 'button'; icon: string; label: string; action: () => void; size?: [number, number] }
  | { type: 'separator' }
  | { type: 'user'; href: string; username: string; display: string; thumbnail?: string; banner?: string; server: string; size?: [number, number] };

export interface UserNav {
  grid: [number, number];
  items: UserNavItem[];
}

export function baseOptions() {
  const { wellKnown, isAdmin, logout } = useApi();
  const user = useCurrentUser();
  const { t, i18n } = useTranslation();

  const meta = wellKnown?.metadata;
  const name = resolveLocalized(meta?.title, i18n.language) || 'Nox';

  return {
    user: user ? {
      grid: [3, -1] as [number, number],
      items: [
        {
          type: 'user' as const,
          href: `/u/${user.username}`,
          username: user.username,
          display: user.display ?? user.username,
          thumbnail: user.thumbnail ?? undefined,
          banner: user.banner ?? undefined,
          server: user.server,
          size: [1, 2] as [number, number]
        },
        {
          type: 'link' as const,
          icon: 'material-symbols:dashboard-rounded',
          label: t('nav.dashboard'),
          href: '/dashboard',
          size: [1, 1] as [number, number]
        },
        {
          type: 'link' as const,
          icon: 'material-symbols:chat-rounded',
          label: t('nav.messages'),
          href: '/messages',
          size: [1, 1] as [number, number]
        },
        ...(isAdmin ? [{
          type: 'link' as const,
          icon: 'material-symbols:admin-panel-settings-rounded',
          label: t('nav.admin'),
          href: '/admin',
          size: [1, 1] as [number, number]
        }] : []),
        {
          type: 'separator' as const
        },
        {
          type: 'button' as const,
          icon: 'material-symbols:logout-rounded',
          label: t('auth.logout'),
          action: logout,
          size: [isAdmin ? 1 : 2, 1] as [number, number]
        },
      ] as UserNavItem[],
    } : null,
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
    links: [
      ...((wellKnown?.features ?? []).length > 0 ? [
        {
          type: 'menu' as const,
          icon: <Icon icon="material-symbols:extension-rounded" className="h-4 w-4" />,
          text: t('features.label'),
          items: (wellKnown?.features ?? []).map(feature => ({
            type: 'main' as const,
            icon: featureIcons[feature] ? <Icon icon={featureIcons[feature]} className="h-4 w-4" /> : undefined,
            description: t(`features.${feature}.description`),
            text: t(`features.${feature}.label`),
            url: `/search?type=${feature}`
          }))
        },
      ] : []),
      {
        type: 'menu' as const,
        icon: <Icon icon="material-symbols:gavel-rounded" className="h-4 w-4" />,
        text: t('legal.label'),
        items: [
          {
            type: 'main' as const,
            icon: <Icon icon="material-symbols:lock-rounded" className="h-4 w-4" />,
            text: t('legal.privacy.label'),
            description: t('legal.privacy.description'),
            url: '/privacy',
          },
          {
            type: 'main' as const,
            icon: <Icon icon="material-symbols:article-rounded" className="h-4 w-4" />,
            text: t('legal.terms.label'),
            description: t('legal.terms.description'),
            url: '/terms',
          },
          {
            type: 'main' as const,
            icon: <Icon icon="material-symbols:gavel-rounded" className="h-4 w-4" />,
            text: t('legal.rules.label'),
            description: t('legal.rules.description'),
            url: '/rules',
          }
        ]
      }
    ]
  };
}
