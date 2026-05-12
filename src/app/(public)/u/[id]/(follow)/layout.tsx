'use client';

import React from 'react';
import { useParams, usePathname } from 'next/navigation';
import { PageTitle } from '@/components/shared/PageTitle';
import { useUser } from '@/components/features/users/UserContext';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

const PAGE_LABEL: Record<string, string> = {
  followers: 'user.followers',
  following: 'user.following',
};

export default function UserFollowLayout({ children }: { children: React.ReactNode }) {
  const { username } = useParams<{ username: string }>();
  const pathname = usePathname();
  const { user } = useUser();
  const { t } = useTranslation();

  const baseHref = `/u/${username}`;
  const segment = pathname.split('/').at(-1) ?? '';
  const labelKey = PAGE_LABEL[segment] ?? 'user.followers';

  if (!user) return null;

  return (
    <>
      <PageTitle title={`${user.display ?? user.username} – ${t(labelKey)}`} />
      <div className="container max-w-3xl mx-auto py-8 px-4 space-y-4">
        <div className="flex items-center gap-3">
          <Link
            href={baseHref}
            className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent transition-colors"
            aria-label={t('common.back')}
          >
            <Icon icon="material-symbols:arrow-back-rounded" className="h-5 w-5" />
          </Link>
          <div>
            <p className="text-xl font-bold font-heading">{t(labelKey)}</p>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
          </div>
        </div>
        {children}
      </div>
    </>
  );
}
