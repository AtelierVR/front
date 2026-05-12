'use client';

import React, { useState, useEffect } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApi } from '@/lib/api/context';
import { getInstance } from '@/lib/api/instances';
import { getWorld, getWorldAssets } from '@/lib/api/worlds';
import { getUser } from '@/lib/api/users';
import { parseNoxId, noxIdToSegment } from '@/types/nox-identifier';
import type { ApiInstance, ApiUser, ApiWorld, ApiWorldAsset } from '@/types/api';
import { entityStore } from '@/lib/cache/store';
import { InstanceContext } from '@/components/features/instances/InstanceContext';
import { InstanceBanner } from '@/components/features/instances/InstanceBanner';
import { InstanceDisplay } from '@/components/features/instances/InstanceDisplay';
import { InstanceTagBox } from '@/components/features/instances/InstanceTagBox';
import { InstanceWorldCard } from '@/components/features/instances/InstanceWorldCard';
import { InstanceOwnerCard } from '@/components/features/instances/InstanceOwnerCard';
import { InstanceLayoutSkeleton } from '@/components/features/instances/InstanceLayoutSkeleton';
import { JoinButton } from '@/components/features/instances/JoinButton';
import { PageTitle } from '@/components/shared/PageTitle';
import { useTranslation } from 'react-i18next';

export default function InstanceLayout({ children }: { children: React.ReactNode }) {
    const { id } = useParams<{ id: string }>();
    const pathname = usePathname();
    const router = useRouter();
    const { currentUser, wellKnown } = useApi();
    const { t } = useTranslation();

    const [instance, setInstance] = useState<ApiInstance | null>(null);
    const [world, setWorld] = useState<ApiWorld | null>(null);
    const [worldAssets, setWorldAssets] = useState<ApiWorldAsset[] | null>(null);
    const [owner, setOwner] = useState<ApiUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshToken, setRefreshToken] = useState(0);
    const refresh = () => setRefreshToken(t => t + 1);

    useEffect(() => {
        if (!wellKnown) return;
        let cancelled = false;
        setLoading(true);

        getInstance(id)
            .then(async (inst) => {
                if (cancelled) return;
                entityStore.put(`instance:${inst.id}`, inst);
                setInstance(inst);

                const localAddress = wellKnown.address ?? '::';

                // Fetch world + assets + owner in parallel
                await Promise.allSettled([
                    getWorld(inst.world).then(async (w) => {
                        if (cancelled) return;
                        setWorld(w);
                        try {
                            const assets = await getWorldAssets(inst.world, w.release);
                            if (!cancelled) setWorldAssets(assets.items);
                        } catch {
                            if (!cancelled) setWorldAssets([]);
                        }
                    }),
                    getUser(noxIdToSegment(inst.owner, localAddress)).then((u) => {
                        if (!cancelled) setOwner(u);
                    }),
                ]);
            })
            .catch(() => { if (!cancelled) notFound(); })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, [id, wellKnown, refreshToken]);

    // Sync WS instance:update into local state
    useEffect(() => {
        if (!instance) return;
        const key = `instance:${instance.id}`;
        return entityStore.subscribe(key, () => {
            const cached = entityStore.get<ApiInstance>(key);
            if (cached) setInstance(cached);
        });
    }, [instance?.id]);

    const isOwner = !!(currentUser && instance &&
        parseNoxId(instance.owner).id === String(currentUser.id));

    const baseHref = `/i/${id}`;
    const activeTab = pathname.startsWith(`${baseHref}/`)
        ? pathname.slice(baseHref.length + 1)
        : 'description';

    if (loading) return <InstanceLayoutSkeleton />;
    if (!instance) notFound();

    return (
        <InstanceContext.Provider value={{ instance, world, worldAssets, isOwner, owner, refresh }}>
            <PageTitle title={instance.title} />
            <div className="container max-w-6xl mx-auto py-8 px-4">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6">
                    {/* Main column */}
                    <div className="space-y-6">
                        <Card className="relative overflow-hidden pt-0">
                            <InstanceBanner />
                            <div className="flex flex-col lg:flex-row gap-2 lg:items-center">
                                <InstanceDisplay className="py-4 flex-1" />
                                <div className="flex flex-row gap-2 justify-center lg:justify-start px-6 pb-4 lg:pb-0">
                                    <JoinButton connection={instance.connection} />
                                </div>
                            </div>
                        </Card>

                        <Tabs
                            value={activeTab}
                            onValueChange={(v) => router.push(v === 'description' ? baseHref : `${baseHref}/${v}`)}
                        >
                            <TabsList className="w-full justify-start">
                                <TabsTrigger value="description">{t('instance.tab_description')}</TabsTrigger>
                                <TabsTrigger value="players">{t('instance.tab_players')}</TabsTrigger>
                                {isOwner && <TabsTrigger value="edit">{t('instance.tab_edit')}</TabsTrigger>}
                            </TabsList>
                        </Tabs>

                        {children}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <InstanceWorldCard />
                        <InstanceOwnerCard />
                        <InstanceTagBox />
                    </div>
                </div>
            </div>
        </InstanceContext.Provider>
    );
}
