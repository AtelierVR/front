'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { SidebarCard } from '@/components/shared/SidebarCard';
import { useUser } from './UserContext';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { resolveTagDisplay } from '@/components/tags';

const MAX_VISIBLE = 12;

export function UserTagBox() {
  const { user, isSame } = useUser();
  const { t, i18n } = useTranslation();
  const [showAll, setShowAll] = useState(false);

  if (!user) return null;

  // Resolve each tag to its display descriptor (null = hidden)
  const resolved = (user.tags ?? [])
    .map(tag => ({ tag, display: resolveTagDisplay(tag) }))
    .filter((d): d is { tag: string; display: NonNullable<ReturnType<typeof resolveTagDisplay>> } => d.display !== null);

  if (!isSame && resolved.length === 0) return null;

  const visible = showAll ? resolved : resolved.slice(0, MAX_VISIBLE);
  const hasMore = resolved.length > MAX_VISIBLE;

  return (
    <SidebarCard title={t('user.tags')} editHref="/settings/profile#tags" isSame={isSame}>
      {resolved.length === 0 ? (
        <p className="text-xs text-muted-foreground italic text-center py-2">{t('user.no_tags')}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {visible.map(({ tag, display }) => (
            <Badge
              key={tag}
              variant="secondary"
              className={cn('text-xs gap-1', display.background)}
              style={display.color ? { color: display.color } : undefined}
            >
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
          {hasMore && !showAll && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-5 px-1.5"
              onClick={() => setShowAll(true)}
            >
              +{resolved.length - MAX_VISIBLE} {t('common.more')}
            </Button>
          )}
        </div>
      )}
    </SidebarCard>
  );
}
