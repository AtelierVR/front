'use client';

import { Badge } from '@/components/ui/badge';
import { SidebarCard } from '@/components/shared/SidebarCard';
import { isHiddenTag } from '@/lib/utils';
import { useInstance } from './InstanceContext';
import { useTranslation } from 'react-i18next';

export function InstanceTagBox() {
  const { instance } = useInstance();
  const { t } = useTranslation();

  const tags = (instance?.tags ?? []).filter((tag) => !isHiddenTag(tag));

  if (instance && tags.length === 0) return null;

  return (
    <SidebarCard title={t('instance.tags')}>
      {tags.length === 0 ? (
        <p className="text-xs text-muted-foreground italic text-center py-2">{t('instance.no_tags')}</p>
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
