'use client';

import { useEffect } from 'react';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { SidebarCard } from '@/components/shared/SidebarCard';
import { useInstance } from './InstanceContext';
import { useTranslation } from 'react-i18next';
import { resolveTagDisplay } from '@/components/tags';

export function InstanceTagBox() {
  const { instance } = useInstance();
  const { t, i18n } = useTranslation();

  const resolved = (instance?.tags ?? [])
    .map(tag => ({ tag, display: resolveTagDisplay(tag) }))
    .filter((d): d is { tag: string; display: NonNullable<ReturnType<typeof resolveTagDisplay>> } => d.display !== null);

  if (instance && resolved.length === 0) return null;

  return (
    <SidebarCard title={t('instance.tags')}>
      {resolved.length === 0 ? (
        <p className="text-xs text-muted-foreground italic text-center py-2">{t('instance.no_tags')}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {resolved.map(({ tag, display }) => (
            <Badge key={tag} variant="secondary" className={cn('text-xs gap-1', display.background)} style={display.color ? { color: display.color } : undefined}>
              {display.icon != null && (
                typeof display.icon === 'string' ? (
                  <Icon icon={display.icon} className="size-3 shrink-0" />
                ) : (
                  display.icon
                )
              )}
              <span className="truncate max-w-[120px]">{display.label}</span>
            </Badge>
          ))}
        </div>
      )}
    </SidebarCard>
  );
}
