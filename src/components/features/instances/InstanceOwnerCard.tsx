'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { useInstance } from './InstanceContext';
import { useApi } from '@/lib/api/context';
import { noxIdToSegment } from '@/types/nox-identifier';
import { getAlias } from '@/lib/api';
import { SidebarCard } from '@/components/shared/SidebarCard';
import Image from 'next/image';

export function InstanceOwnerCard() {
    const { instance, owner } = useInstance();
    const { wellKnown } = useApi();
    const { t } = useTranslation();
    const localAddress = wellKnown?.address ?? '::';

    if (!instance || !owner)
        return null;

    const rawId = getAlias(owner.alias, 'uid') ?? getAlias(owner.alias, 'iid') ?? `${owner.id}@${owner.server}`;
    const href = `/u/${noxIdToSegment(rawId, localAddress)}`;

    return (
        <SidebarCard title={t('instance.owner')}>
            <Link href={href} className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted transition-colors group">
                {/* Thumbnail */}
                <div className="size-9 shrink-0 rounded-sm overflow-hidden bg-muted flex items-center justify-center">
                    {owner.thumbnail
                        ? <Image
                            src={owner.thumbnail}
                            alt={owner.display}
                            className="size-full object-cover"
                            width={36}
                            height={36}
                        />
                        : <Icon icon="material-symbols:public" className="size-5 text-muted-foreground" />}
                </div>

                {/* Labels */}
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                        {owner.display ?? rawId}
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
