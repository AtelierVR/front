'use client';

import { useEffect } from 'react';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { SidebarCard } from '@/components/shared/SidebarCard';
import { useWorld } from './WorldContext';
import { useTranslation } from 'react-i18next';
import { resolveTagDisplay } from '@/components/tags';

export function WorldTagBox() {
  const { world, isOwner, isContributor } = useWorld();
  const { t, i18n } = useTranslation();

  const resolved = (world?.tags ?? [])
    .map(tag => ({ tag, display: resolveTagDisplay(tag) }))
    .filter((d): d is { tag: string; display: NonNullable<ReturnType<typeof resolveTagDisplay>> } => d.display !== null);

  if (!isOwner && !isContributor && resolved.length === 0) return null;

  return (
    <SidebarCard
      title={t('world.tags')}
      editHref={world ? `/w/${world.id}/edit#tags` : undefined}
      isSame={isOwner || isContributor}
    >
      {resolved.length === 0 ? (
        <p className="text-xs text-muted-foreground italic text-center py-2">{t('world.no_tags')}</p>
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
