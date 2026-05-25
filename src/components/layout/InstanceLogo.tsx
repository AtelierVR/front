'use client';

import { useApi } from '@/lib/api/context';
import { cn } from '@/lib/utils';
import { resolveLocalized } from '@/lib/i18n/resolveLocalized';
import { useTranslation } from 'react-i18next';
import { useInstanceIcon } from '@/lib/useInstanceIcon';
import Image from 'next/image';

export function InstanceLogo({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    const { wellKnown } = useApi();
    const { i18n } = useTranslation();
    const url = useInstanceIcon(wellKnown?.metadata?.icon) ?? '/icon.png';
    const label = resolveLocalized(wellKnown?.metadata?.title, i18n.language) || 'Nox';

    return <div
        {...props}
        className={cn('relative h-8 w-8 shrink-0', className)}
    >
        <Image
            src={url}
            fill
            sizes="32px"
            alt={label}
            className="rounded-sm object-contain"
        />
    </div>;
}
