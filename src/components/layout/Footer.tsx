'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { useApi } from '@/lib/api/context';
import { Separator } from '@/components/ui/separator';
import { NoxWellKnown } from '@/types/wellknown';
import { cn } from '@/lib/utils';
import Image from '@/components/NoxImage';
import { resolveLocalized } from '@/lib/i18n/resolveLocalized';
import { useInstanceIcon } from '@/lib/useInstanceIcon';

const SOCIAL_ICONS: Record<string, string> = {
  mastodon: 'simple-icons:mastodon',
  discord: 'simple-icons:discord',
  twitter: 'simple-icons:x',
  youtube: 'simple-icons:youtube',
  github: 'simple-icons:github',
  email: 'material-symbols:mail-rounded',
};

function socialIcon(platform: string): string {
  return SOCIAL_ICONS[platform.toLowerCase()] ?? 'material-symbols:link-rounded';
}

export function Footer() {
  const { t, i18n } = useTranslation();
  const { wellKnown } = useApi();

  const instanceName = resolveLocalized(wellKnown?.metadata.title, i18n.language) || t('footer.name');
  const tagline = resolveLocalized(wellKnown?.metadata.description, i18n.language) || t('footer.description');
  const iconUrl = useInstanceIcon(wellKnown?.metadata.icon);

  // Build flat list of { platform, href } from the socials map
  const socials: { platform: string; href: string }[] = Object.entries(
    wellKnown?.metadata.socials ?? {},
  ).flatMap(([platform, value]) =>
    (Array.isArray(value) ? value : [value]).map((href) => ({ platform, href })),
  );

  const platformLinks = [
    { href: '/', label: t('footer.home') },
    { href: '/search', label: t('footer.search') },
    { href: '/register', label: t('footer.register') },
  ];

  const legalLinks = [
    { href: '/terms', label: t('footer.terms_of_service') },
    { href: '/privacy', label: t('footer.privacy_policy') },
    { href: '/rules', label: t('footer.rules') },
  ];

  const communityLinks = [
    { href: 'https://activitypub.rocks', label: t('footer.fediverse'), external: true },
    { href: 'https://github.com/AtelierVR', label: t('footer.github'), external: true },
    { href: '/about', label: t('footer.about') },
  ];

  return (
    <footer className="mt-auto border-t border-border bg-background">
      <div className="container mx-auto px-4 py-12">
        {/* Top grid */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="flex flex-col gap-4 lg:col-span-2">
            <div className="flex items-center gap-2">
              {iconUrl && (
                <Image
                  src={iconUrl}
                  width={28}
                  height={28}
                  alt={instanceName}
                  className="h-7 w-7 rounded-sm object-cover"
                />
              )}
              <span className="font-semibold text-lg">{instanceName}</span>
            </div>
            <p className="max-w-xs text-sm text-muted-foreground">{tagline}</p>
            {socials.length > 0 && (
              <div className="flex items-center gap-3">
                {socials.map(({ platform, href }, index) => (
                  <a
                    key={index}
                    href={href}
                    aria-label={platform}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Icon icon={socialIcon(platform)} className="h-5 w-5" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Platform column */}
          <div className="flex flex-col gap-3">
            <span className="text-sm font-semibold">{t('footer.col_platform')}</span>
            {platformLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Legal column */}
          <div className="flex flex-col gap-3">
            <span className="text-sm font-semibold">{t('footer.col_legal')}</span>
            {legalLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Community column */}
          <div className="flex flex-col gap-3">
            <span className="text-sm font-semibold">{t('footer.col_community')}</span>
            {communityLinks.map(({ href, label, external }, index) =>
              external ? (
                <a
                  key={index}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {label}
                </a>
              ) : (
                <Link
                  key={index}
                  href={href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {label}
                </Link>
              ),
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <Separator className="my-8" />
        <div className="flex flex-col gap-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Status status={wellKnown?.status ?? "offline"} />
          </div>
        </div>
      </div>
    </footer>
  );
}
type StatusType = NoxWellKnown["status"] | "offline";
interface StatusInfo {
  label: string;
  color: string;
}

const STATUS: Record<StatusType, StatusInfo> = {
  online: { label: 'footer.status.online', color: 'bg-green-500' },
  degraded: { label: 'footer.status.degraded', color: 'bg-yellow-500' },
  offline: { label: 'footer.status.offline', color: 'bg-red-500' },
  maintenance: { label: 'footer.status.maintenance', color: 'bg-yellow-500' },
}

function Status({ status }: { status: StatusType }) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      <span className={cn("h-3 w-3 rounded-full", STATUS[status].color)} />
      <span>{t(STATUS[status].label)}</span>
    </div>
  );
}
