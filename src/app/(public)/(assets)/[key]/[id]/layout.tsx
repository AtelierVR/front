'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { notFound, useParams, usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ModalDrawer } from '@/components/shared/ModalDrawer';
import { PageTitle, setTitle } from '@/components/shared/PageTitle';
import { useApi } from '@/lib/api/context';
import { getAsset, instanceAssets } from '@/lib/api/assets';
import { entityStore } from '@/lib/cache/store';
import { parseNoxId } from '@/types/nox-identifier';
import type { ApiAsset } from '@/types/api';
import { AssetContext } from '@/components/features/assets/AssetContext';
import { AssetBanner } from '@/components/features/assets/AssetBanner';
import { AssetDisplay } from '@/components/features/assets/AssetDisplay';
import { AssetLayoutSkeleton } from '@/components/features/assets/AssetLayoutSkeleton';
import { assetSlots } from '@/components/features/assets/asset-slots';

/**
 * Generic asset page: `/[key]/[id]` (`/w/devworld`, `/a/alatazia`, `/m/…`).
 *
 * The `key` is a Nox identifier key (`w`, `a`, `m`), matched against the kinds
 * the instance serves (`GET /configs`, `assets`) — that declaration gives the
 * endpoint to fetch and the URL prefix of the asset's own pages. Kind-specific
 * widgets come from `assetSlots`, everything else is shared.
 */
export default function AssetLayout({ children }: { children: React.ReactNode }) {
    const { key, id } = useParams<{ key: string; id: string }>();
    const pathname = usePathname();
    const { currentUser, wellKnown, config } = useApi();
    const { t } = useTranslation();

    /** Kind the URL key points to, once the config is known. */
    const kind = useMemo(
        () =>
            instanceAssets(config).find(
                (asset) => asset.key.toLocaleLowerCase() === key.toLocaleLowerCase(),
            ) ?? null,
        [config, key],
    );

    // The asset, keyed by what was fetched: while the request is in flight (or
    // after the key/id changed) the previous asset is simply ignored.
    const requestKey = kind ? `${kind.endpoint}/${id}` : null;
    const [loaded, setLoaded] = useState<{ key: string; asset: ApiAsset } | null>(null);
    const asset = loaded && loaded.key === requestKey ? loaded.asset : null;

    const [refreshToken, setRefreshToken] = useState(0);
    const refresh = () => setRefreshToken((token) => token + 1);

    useEffect(() => {
        // Wait for the config: it tells which endpoint serves this key.
        if (!config || !kind || !requestKey) return;
        let cancelled = false;

        getAsset(kind.endpoint, id)
            .then((value) => {
                if (cancelled) return;
                entityStore.put(`${value.type}:${value.id}`, value);
                setLoaded({ key: requestKey, asset: value });
            })
            .catch(() => { /* handled by the `!asset` branch below */ });

        return () => { cancelled = true; };
    }, [config, kind, id, requestKey, wellKnown, refreshToken]);

    // Live updates pushed by the node, on the same cache key.
    useEffect(() => {
        if (!asset) return;
        const cacheKey = `${asset.type}:${asset.id}`;
        return entityStore.subscribe(cacheKey, () => {
            const cached = entityStore.get<ApiAsset>(cacheKey);
            if (cached && requestKey) setLoaded({ key: requestKey, asset: cached });
        });
    }, [asset, requestKey]);

    const isOwner = !!(currentUser && asset && parseNoxId(asset.owner).id === String(currentUser.id));
    const isContributor = !!(currentUser && asset &&
        asset.contributors.some((contributor) => parseNoxId(contributor).id === String(currentUser.id)));
    const canEdit = isOwner || isContributor;

    const slots = asset ? assetSlots(asset.type) : {};
    const baseHref = kind ? `/${kind.key}/${id}` : '';
    const sub = kind && pathname.startsWith(`${baseHref}/`) ? pathname.slice(baseHref.length + 1) : 'description';

    const [editOpen, setEditOpen] = useState(false);

    // `/…/edit` (the edit links of the description and display cards) opens the
    // drawer instead of being a page of its own.
    useEffect(() => {
        if (sub === 'edit' && canEdit) setEditOpen(true);
    }, [sub, canEdit]);

    useEffect(() => {
        setTitle(asset?.title ?? asset?.name ?? null);
    }, [asset?.title, asset?.name]);

    if (!config) return <AssetLayoutSkeleton />;
    if (!kind) notFound();
    if (!asset) return <AssetLayoutSkeleton />;

    const tabs = [
        { value: 'description', label: t('common.description', { defaultValue: '' }) },
        ...(slots.instances ? [{ value: 'instances', label: t(slots.instances.label) }] : []),
        { value: 'releases', label: t('common.releases', { defaultValue: '' }) },
    ];
    const activeTab = tabs.some((tab) => tab.value === sub) ? sub : 'description';

    /** URL of a tab: the description is the asset page itself, the rest are sub-pages. */
    const tabHref = (value: string) => (value === 'description' ? baseHref : `${baseHref}/${value}`);

    return (
        <AssetContext.Provider value={{ asset, kind, isOwner, isContributor, refresh }}>
            <PageTitle title={asset.title ?? asset.name ?? ''} />
            <div className="container max-w-6xl mx-auto py-8 px-4">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6">
                    {/* Main column */}
                    <div className="space-y-6">
                        <Card className="relative overflow-hidden pt-0">
                            <AssetBanner />

                            <div className='flex flex-col lg:flex-row gap-2 px-6 lg:items-center'>
                                <AssetDisplay className="flex-1" />
                                <div className="flex flex-row gap-2 justify-center lg:justify-start">
                                    {slots.actions}
                                </div>
                            </div>
                        </Card>

                        <Tabs value={activeTab}>
                            <TabsList className="w-full justify-start">
                                {tabs.map((tab) => (
                                    <TabsTrigger
                                        key={tab.value}
                                        value={tab.value}
                                        // Real links: middle-click and "open in a new tab" work.
                                        render={<Link href={tabHref(tab.value)} />}
                                    >
                                        {tab.label || tab.value}
                                    </TabsTrigger>
                                ))}
                                {canEdit && slots.EditForm && (
                                    <Button variant="ghost" size="icon-sm" className="shrink-0 ml-auto" onClick={() => setEditOpen(true)} aria-label={t('common.edit')}>
                                        <Icon icon="material-symbols:edit-rounded" className="size-4" />
                                    </Button>
                                )}
                            </TabsList>
                        </Tabs>

                        {children}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {slots.Info && <slots.Info />}
                        {slots.sidebar}
                    </div>
                </div>
            </div>

            {slots.EditForm && (
                <ModalDrawer open={editOpen} onOpenChange={setEditOpen} header={t('common.edit')} large>
                    <slots.EditForm />
                </ModalDrawer>
            )}
        </AssetContext.Provider>
    );
}
