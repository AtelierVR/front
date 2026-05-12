'use client';

import Link from 'next/link';
import { Icon } from '@iconify/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAvatar } from './AvatarContext';
import { useTranslation } from 'react-i18next';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';

export function AvatarDescription() {
  const { avatar, isOwner, isContributor } = useAvatar();
  const { t } = useTranslation();
  const canEdit = isOwner || isContributor;

  return (
    <Card className="group/card relative">
      {canEdit && avatar && (
        <Link href={`/a/${avatar.id}/edit#description`} className="absolute top-3 right-3 z-10">
          <Button variant="ghost" size="icon" className="size-6 opacity-0 group-hover/card:opacity-100 transition-opacity">
            <Icon icon="material-symbols:edit-rounded" className="size-4" />
          </Button>
        </Link>
      )}
      <CardContent>
        {!avatar ? (
          <div className="space-y-2">
            {[60, 80, 40].map((w, i) => (
              <div key={i} style={{ inlineSize: `${w}%` }} className="animate-pulse rounded-sm bg-muted h-3" />
            ))}
          </div>
        ) : avatar.description ? (
          <MarkdownRenderer content={avatar.description} />
        ) : (
          <p className="text-sm text-muted-foreground italic">{t('avatar.no_description')}</p>
        )}
      </CardContent>
    </Card>
  );
}
