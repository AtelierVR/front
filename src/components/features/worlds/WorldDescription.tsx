'use client';

import Link from 'next/link';
import { Icon } from '@iconify/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWorld } from './WorldContext';
import { useTranslation } from 'react-i18next';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';

export function WorldDescription() {
  const { world, isOwner, isContributor } = useWorld();
  const { t } = useTranslation();
  const canEdit = isOwner || isContributor;

  return (
    <Card className="group/card relative">
      {canEdit && world && (
        <Link href={`/w/${world.id}/edit#description`} className="absolute top-3 right-3 z-10">
          <Button variant="ghost" size="icon" className="size-6 opacity-0 group-hover/card:opacity-100 transition-opacity">
            <Icon icon="material-symbols:edit-rounded" className="size-4" />
          </Button>
        </Link>
      )}
      <CardContent>
        {!world ? (
          <div className="space-y-2">
            {[60, 80, 40].map((w, i) => (
              <div key={i} style={{ inlineSize: `${w}%` }} className="animate-pulse rounded-sm bg-muted h-3" />
            ))}
          </div>
        ) : world.description ? (
          <MarkdownRenderer content={world.description} />
        ) : (
          <p className="text-sm text-muted-foreground italic">{t('world.no_description')}</p>
        )}
      </CardContent>
    </Card>
  );
}
