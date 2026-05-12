'use client';

import Link from 'next/link';
import { Icon } from '@iconify/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser } from './UserContext';
import { useTranslation } from 'react-i18next';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';

export function UserBio() {
  const { user, isSame } = useUser();
  const { t } = useTranslation();

  return (
    <Card className="group/card relative">
      {isSame && user && (
        <Link href="/settings/profile#bio" className="absolute top-3 right-3 z-10">
          <Button variant="ghost" size="icon" className="size-6 opacity-0 group-hover/card:opacity-100 transition-opacity">
            <Icon icon="material-symbols:edit-rounded" className="size-4" />
          </Button>
        </Link>
      )}
      <CardContent>
        {!user ? (
          <div className="space-y-2">
            {[60, 80, 40].map((w, i) => (
              <div key={i} style={{ inlineSize: `${w}%` }} className="animate-pulse rounded-sm bg-muted h-3" />
            ))}
          </div>
        ) : user.bio ? (
          <MarkdownRenderer content={user.bio} />
        ) : (
          <p className="text-sm text-muted-foreground italic">{t('user.no_bio')}</p>
        )}
      </CardContent>
    </Card>
  );
}
