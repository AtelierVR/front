'use client';

import React, { useState, useEffect } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApi } from '@/lib/api/context';
import { getAvatar, getAvatarAssets } from '@/lib/api/avatars';
import { parseNoxId } from '@/types/nox-identifier';
import type { ApiAvatar, ApiAvatarAsset } from '@/types/api';
import { entityStore } from '@/lib/cache/store';
import { AvatarContext } from '@/components/features/avatars/AvatarContext';
import { AvatarBanner } from '@/components/features/avatars/AvatarBanner';
import { AvatarDisplay } from '@/components/features/avatars/AvatarDisplay';
import { AvatarTagBox } from '@/components/features/avatars/AvatarTagBox';
import { AvatarInfo } from '@/components/features/avatars/AvatarInfo';
import { AvatarContributors } from '@/components/features/avatars/AvatarContributors';
import { AvatarLayoutSkeleton } from '@/components/features/avatars/AvatarLayoutSkeleton';
import { WearButton } from '@/components/features/avatars/WearButton';
import { FavoriteButton } from '@/components/features/avatars/FavoriteButton';
import { PageTitle, setTitle } from '@/components/shared/PageTitle';
import { useTranslation } from 'react-i18next';

export default function AvatarLayout({ children }: { children: React.ReactNode }) {
    const { id } = useParams<{ id: string }>();
    const pathname = usePathname();
    const router = useRouter();
    const { currentUser, wellKnown } = useApi();
    const { t } = useTranslation();

    const [avatar, setAvatar] = useState<ApiAvatar | null>(null);
    const [allAssets, setAllAssets] = useState<ApiAvatarAsset[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshToken, setRefreshToken] = useState(0);
    const refresh = () => setRefreshToken(t => t + 1);

    useEffect(() => {
        if (!wellKnown) return;
        let cancelled = false;
        setLoading(true);

        getAvatar(id)
            .then(async (a) => {
                if (cancelled) return;
                entityStore.put(`avatar:${a.id}`, a);
                setAvatar(a);
                try {
                    const assets = await getAvatarAssets(id);
                    if (!cancelled) setAllAssets(assets.items);
                } catch {
                    if (!cancelled) setAllAssets([]);
                }
            })
            .catch(() => { if (!cancelled) notFound(); })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, [id, wellKnown, refreshToken]);

    // Sync WS avatar:update into local state
    useEffect(() => {
        if (!avatar) return;
        const key = `avatar:${avatar.id}`;
        return entityStore.subscribe(key, () => {
            const cached = entityStore.get<ApiAvatar>(key);
            if (cached) setAvatar(cached);
        });
    }, [avatar?.id]);

    const isOwner = !!(currentUser && avatar &&
        parseNoxId(avatar.owner).id === String(currentUser.id));
    const isContributor = !!(currentUser && avatar &&
        avatar.contributors.some((c) => parseNoxId(c).id === String(currentUser.id)));
    const canEdit = isOwner || isContributor;

    const baseHref = `/a/${id}`;
    const activeTab = pathname.startsWith(`${baseHref}/`)
        ? pathname.slice(baseHref.length + 1)
        : 'description';

    useEffect(() => {
        setTitle(avatar?.title ?? null);
    }, [activeTab, baseHref, router]);

    if (loading) return <AvatarLayoutSkeleton />;
    if (!avatar) notFound();

    return (
        <AvatarContext.Provider value={{ avatar, allAssets, isOwner, isContributor, refresh }}>
            <PageTitle title={avatar.title} />
            <div className="container max-w-6xl mx-auto py-8 px-4">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6">
                    {/* Main column */}
                    <div className="space-y-6">
                        <Card className="relative overflow-hidden pt-0">
                            <AvatarBanner />
                            <div className='flex flex-col lg:flex-row gap-2 px-6 lg:items-center'>
                                <AvatarDisplay className="flex-1" />
                                <div className="flex flex-row gap-2 justify-center lg:justify-start">
                                    <WearButton />
                                    <FavoriteButton />
                                </div>
                            </div>
                        </Card>

                        <Tabs
                            value={activeTab}
                            onValueChange={(v) => router.push(v === 'description' ? baseHref : `${baseHref}/${v}`)}
                        >
                            <TabsList className="w-full justify-start">
                                <TabsTrigger value="description">{t('avatar.description')}</TabsTrigger>
                                <TabsTrigger value="versions">{t('avatar.versions')}</TabsTrigger>
                                {canEdit && <TabsTrigger value="edit">{t('avatar.edit')}</TabsTrigger>}
                            </TabsList>
                        </Tabs>

                        {children}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <AvatarInfo />
                        <AvatarTagBox />
                        <AvatarContributors />
                    </div>
                </div>
            </div>
        </AvatarContext.Provider>
    );
}
