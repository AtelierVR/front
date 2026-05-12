'use client';

import React from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApi } from '@/lib/api/context';
import { UserBanner } from '@/components/features/users/UserBanner';
import { UserThumbnail } from '@/components/features/users/UserThumbnail';
import { UserDisplay } from '@/components/features/users/UserDisplay';
import { UserFollowStats } from '@/components/features/users/UserFollowStats';
import { UserLinkBox } from '@/components/features/users/UserLinkBox';
import { UserTagBox } from '@/components/features/users/UserTagBox';
import { UserLocations } from '@/components/features/users/UserLocations';
import { FollowAddButton } from '@/components/features/users/FollowAddButton';
import { FollowRemoveButton } from '@/components/features/users/FollowRemoveButton';
import { PresenceOverlay } from '@/components/features/users/PresenceOverlay';
import { PageTitle } from '@/components/shared/PageTitle';
import { useUser } from '@/components/features/users/UserContext';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { t } from 'i18next';
export default function UserProfileLayout({ children }: { children: React.ReactNode }) {
  const { username } = useParams<{ username: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser } = useApi();
  const { user, setUser, isSame } = useUser();
  const { t: tl } = useTranslation();

  const rel = user?.relations;
  const isMutual = rel?.out === 'follow' && rel?.in === 'follow';
  const followsYou = rel?.in === 'follow' && !isMutual;
  const pendingYou = rel?.in === 'request';

  const baseHref = `/u/${username}`;
  const activeTab = pathname.startsWith(`${baseHref}/`) ? pathname.slice(baseHref.length + 1) : 'description';

  if (!user) return null;

  return (
    <>
      <PageTitle title={user.display ?? user.username} />
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6">
          {/* Main column */}
          <div className="space-y-6">
            <Card className="relative overflow-hidden pt-0">
              <PresenceOverlay user={user} isSame={isSame} />

              <UserBanner />

              <div className="relative flex items-center ms-12 h-8">
                <UserThumbnail />
                <div className="absolute inset-x-0 flex items-center justify-between px-4 ps-32">
                  <div className="flex items-center gap-1.5">
                    {currentUser && !isSame && isMutual && (
                      <Badge variant="secondary" className="gap-1">
                        <Icon icon="material-symbols:group-rounded" className="size-3" />
                        {tl('user.friend')}
                      </Badge>
                    )}
                    {currentUser && !isSame && followsYou && (
                      <Badge variant="secondary" className="gap-1">
                        <Icon icon="material-symbols:person-check-rounded" className="size-3" />
                        {tl('user.follows_you')}
                      </Badge>
                    )}
                    {currentUser && !isSame && pendingYou && (
                      <Badge variant="outline" className="gap-1">
                        <Icon icon="material-symbols:schedule-rounded" className="size-3" />
                        {tl('user.pending_you')}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {currentUser && !isSame && !user.relations?.out
                      && <FollowAddButton user={user} setUser={setUser} />}
                    {currentUser && !isSame && user.relations?.out
                      && <FollowRemoveButton user={user} type={user.relations.out} setUser={setUser} />}
                  </div>
                </div>
              </div>

              <div className="px-6">
                <UserDisplay />
              </div>
            </Card>

            <Tabs
              value={activeTab}
              onValueChange={(v) => router.push(v === 'description' ? baseHref : `${baseHref}/${v}`)}
            >
              <TabsList className="w-full justify-start">
                <TabsTrigger value="description">{t('users.description')}</TabsTrigger>
                <TabsTrigger value="favorites">{t('users.favorites')}</TabsTrigger>
              </TabsList>
            </Tabs>

            {children}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <UserLocations />
            <UserFollowStats />
            <UserLinkBox />
            <UserTagBox />
          </div>
        </div>
      </div>
    </>
  );
}
