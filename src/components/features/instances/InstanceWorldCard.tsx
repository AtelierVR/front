'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { useInstance } from './InstanceContext';
import { useApi } from '@/lib/api/context';
import { noxIdToSegment } from '@/types/nox-identifier';
import { getAlias } from '@/lib/api';
import { SidebarCard } from '@/components/shared/SidebarCard';
import Image from '@/components/NoxImage';

export function InstanceWorldCard() {
    const { instance, world } = useInstance();
    const { wellKnown } = useApi();
    const { t } = useTranslation();
    const localAddress = wellKnown?.address ?? '::';

    if (!instance || !world)
        return null;

    const rawId = getAlias(world.alias, 'nid') ?? `${world.id}@${world.server}`;
    const href = `/w/${noxIdToSegment(rawId, localAddress)}`;

    return (
        <SidebarCard title={t('instance.world')}>
            <Link href={href} className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted transition-colors group">
                {/* Thumbnail */}
                <div className="size-9 shrink-0 rounded-sm overflow-hidden bg-muted flex items-center justify-center">
                    {world.thumbnail
                        ? <Image
                            src={world.thumbnail}
                            alt={world.title ?? world.name ?? ''}
                            className="size-full object-cover"
                            width={36}
                            height={36}
                        />
                        : <Icon icon="material-symbols:public" className="size-5 text-muted-foreground" />}
                </div>

                {/* Labels */}
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                        {world.title ?? world.name ?? rawId}
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                        {rawId}
                    </p>
                </div>

                <Icon icon="material-symbols:arrow-forward-ios-rounded" className="size-3.5 text-muted-foreground shrink-0" />
            </Link>
        </SidebarCard>
    );
}
