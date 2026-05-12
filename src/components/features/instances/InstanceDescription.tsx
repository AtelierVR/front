'use client';

import { Card, CardContent } from '@/components/ui/card';
import { useInstance } from './InstanceContext';
import { useTranslation } from 'react-i18next';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';

export function InstanceDescription() {
  const { instance } = useInstance();
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent>
        {!instance ? (
          <div className="space-y-2">
            {[60, 80, 40].map((w, i) => (
              <div key={i} style={{ inlineSize: `${w}%` }} className="animate-pulse rounded-sm bg-muted h-3" />
            ))}
          </div>
        ) : instance.description ? (
          <MarkdownRenderer content={instance.description} />
        ) : (
          <p className="text-sm text-muted-foreground italic">{t('instance.no_description')}</p>
        )}
      </CardContent>
    </Card>
  );
}
