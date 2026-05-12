'use client';

import { Badge } from '@/components/ui/badge';
import { SidebarCard } from '@/components/shared/SidebarCard';
import { isHiddenTag } from '@/lib/utils';
import { useWorld } from './WorldContext';
import { useTranslation } from 'react-i18next';

export function WorldTagBox() {
  const { world, isOwner, isContributor } = useWorld();
  const { t } = useTranslation();

  const tags = (world?.tags ?? []).filter((tag) => !isHiddenTag(tag));

  if (!isOwner && !isContributor && tags.length === 0) return null;

  return (
    <SidebarCard
      title={t('world.tags')}
      editHref={world ? `/w/${world.id}/edit#tags` : undefined}
      isSame={isOwner || isContributor}
    >
      {tags.length === 0 ? (
        <p className="text-xs text-muted-foreground italic text-center py-2">{t('world.no_tags')}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </SidebarCard>
  );
}
