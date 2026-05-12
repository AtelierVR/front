'use client';

import { isHiddenTag } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { SidebarCard } from '@/components/shared/SidebarCard';
import { useUser } from './UserContext';
import { useTranslation } from 'react-i18next';

export function UserTagBox() {
  const { user, isSame } = useUser();
  const { t } = useTranslation();

  const tags = (user?.tags ?? []).filter((tag) => !isHiddenTag(tag));

  if (!isSame && tags.length === 0) return null;

  return (
    <SidebarCard title={t('user.tags')} editHref="/settings/profile#tags" isSame={isSame}>
      {tags.length === 0 ? (
        <p className="text-xs text-muted-foreground italic text-center py-2">{t('user.no_tags')}</p>
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
