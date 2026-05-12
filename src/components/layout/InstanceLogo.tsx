'use client';

import { useApi } from '@/lib/api/context';
import { cn } from '@/lib/utils';
import { resolveLocalized } from '@/lib/i18n/resolveLocalized';
import { useTranslation } from 'react-i18next';
import { useInstanceIcon } from '@/lib/useInstanceIcon';

export function InstanceLogo({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    const { wellKnown } = useApi();
    const { i18n } = useTranslation();
    const url = useInstanceIcon(wellKnown?.metadata?.icon) ?? '/icon.png';
    const label = resolveLocalized(wellKnown?.metadata?.title, i18n.language) || 'Nox';

    return <div
        {...props}
        className={cn('h-8 w-8', className)}
        style={{
            WebkitMaskImage: `url(${url})`,
            WebkitMaskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskImage: `url(${url})`,
            maskSize: 'contain',
            maskRepeat: 'no-repeat',
            maskPosition: 'center',
            backgroundColor: 'currentColor',
            ...props.style,
        }}
        aria-label={label}
    />;
}
