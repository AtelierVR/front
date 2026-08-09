'use client';

import React, { useState, useEffect } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApi } from '@/lib/api/context';
import { getWorld, getWorldAssets } from '@/lib/api/worlds';
import { parseNoxId } from '@/types/nox-identifier';
import type { ApiWorld, ApiWorldAsset } from '@/types/api';
import { entityStore } from '@/lib/cache/store';
import { WorldContext } from '@/components/features/worlds/WorldContext';
import { WorldBanner } from '@/components/features/worlds/WorldBanner';
import { WorldDisplay } from '@/components/features/worlds/WorldDisplay';
import { WorldTagBox } from '@/components/features/worlds/WorldTagBox';
import { WorldInfo } from '@/components/features/worlds/WorldInfo';
import { WorldContributors } from '@/components/features/worlds/WorldContributors';
import { SetHomeButton } from '@/components/features/worlds/SetHomeButton';
import { FavoriteButton } from '@/components/features/worlds/FavoriteButton';
import { WorldLayoutSkeleton } from '@/components/features/worlds/WorldLayoutSkeleton';
import { PageTitle, setTitle } from '@/components/shared/PageTitle';
import { ModalDrawer } from '@/components/shared/ModalDrawer';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { WorldEditForm } from './edit/edit-form';
import { useTranslation } from 'react-i18next';

export default function WorldLayout({ children }: { children: React.ReactNode }) {
    const { id } = useParams<{ id: string }>();
    const pathname = usePathname();
    const router = useRouter();
    const { currentUser, wellKnown } = useApi();
    const { t } = useTranslation();

    const [world, setWorld] = useState<ApiWorld | null>(null);
    const [allAssets, setAllAssets] = useState<ApiWorldAsset[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshToken, setRefreshToken] = useState(0);
    const refresh = () => setRefreshToken(t => t + 1);

    useEffect(() => {
        if (!wellKnown) return;
        let cancelled = false;
        setLoading(true);

        getWorld(id) // eslint-disable-next-line react-hooks/exhaustive-deps
            .then(async (w) => {
                if (cancelled) return;
                entityStore.put(`world:${w.id}`, w);
                setWorld(w);
                try {
                    const assets = await getWorldAssets(id);
                    if (!cancelled) setAllAssets(assets.items);
                } catch {
                    if (!cancelled) setAllAssets([]);
                }
            })
            .catch(() => { if (!cancelled) notFound(); })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, [id, wellKnown, refreshToken]);

    // Sync WS world:update into local state
    useEffect(() => {
        if (!world) return;
        const key = `world:${world.id}`;
        return entityStore.subscribe(key, () => {
            const cached = entityStore.get<ApiWorld>(key);
            if (cached) setWorld(cached);
        });
    }, [world?.id]);

    const isOwner = !!(currentUser && world &&
        parseNoxId(world.owner).id === String(currentUser.id));
    const isContributor = !!(currentUser && world &&
        world.contributors.some((c) => parseNoxId(c).id === String(currentUser.id)));
    const canEdit = isOwner || isContributor;

    const [editOpen, setEditOpen] = useState(false);

    const baseHref = `/w/${id}`;
    const activeTab = pathname.startsWith(`${baseHref}/`)
        ? pathname.slice(baseHref.length + 1)
        : 'description';

    useEffect(() => {
        setTitle(world?.title ?? null);
    }, [activeTab, baseHref, router]);

    if (loading) return <WorldLayoutSkeleton />;
    if (!world) notFound();

    return (
        <WorldContext.Provider value={{ world, allAssets, isOwner, isContributor, refresh }}>
            <PageTitle title={world.title} />
            <div className="container max-w-6xl mx-auto py-8 px-4">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6">
                    {/* Main column */}
                    <div className="space-y-6">
                        <Card className="relative overflow-hidden pt-0">
                            <WorldBanner />

                            <div className='flex flex-col lg:flex-row gap-2 px-6 lg:items-center'>
                                <WorldDisplay className="flex-1" />
                                <div className="flex flex-row gap-2 justify-center lg:justify-start">
                                    <SetHomeButton />
                                    <FavoriteButton />
                                </div>
                            </div>
                        </Card>

                        <Tabs
                            value={activeTab}
                            onValueChange={(v) => router.push(v === 'description' ? baseHref : `${baseHref}/${v}`)}
                        >
                            <TabsList className="w-full justify-start">
                                <TabsTrigger value="description">{t('world.description')}</TabsTrigger>
                                <TabsTrigger value="instances">{t('world.instances')}</TabsTrigger>
                                <TabsTrigger value="versions">{t('world.versions')}</TabsTrigger>
                                {canEdit && (
                                    <Button variant="ghost" size="icon-sm" className="shrink-0 ml-auto" onClick={() => setEditOpen(true)} aria-label={t('world.edit')}>
                                        <Icon icon="material-symbols:edit-rounded" className="size-4" />
                                    </Button>
                                )}
                            </TabsList>
                        </Tabs>

                        {children}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <WorldInfo />
                        <WorldTagBox />
                        <WorldContributors />
                    </div>
                </div>
            </div>

            <ModalDrawer open={editOpen} onOpenChange={setEditOpen} header={t('world.edit')} large>
                <WorldEditForm />
            </ModalDrawer>
        </WorldContext.Provider>
    );
}
