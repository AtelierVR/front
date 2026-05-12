'use client';

import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ApiUserPresence } from '@/types/api';

interface PresenceBadgeProps {
  presence: ApiUserPresence;
  className?: string;
}

const PRESENCE_STYLES: Record<ApiUserPresence["status"], string> = {
  online:  'bg-green-500/15 text-green-600 border-green-500/30 dark:text-green-400',
  oja:     'bg-green-500/15 text-green-600 border-green-500/30 dark:text-green-400',
  ojf:     'bg-blue-400/15 text-blue-500 border-blue-400/30 dark:text-blue-300',
  busy:    'bg-yellow-500/15 text-yellow-700 border-yellow-500/30 dark:text-yellow-400',
  dnd:     'bg-red-500/15 text-red-600 border-red-500/30 dark:text-red-400',
  stream:  'bg-purple-500/15 text-purple-600 border-purple-500/30 dark:text-purple-400',
  offline: 'bg-muted text-muted-foreground border-border',
};

export const DOT_COLORS: Record<ApiUserPresence["status"], string> = {
  online:  'bg-green-500',
  oja:     'bg-green-500',
  ojf:     'bg-blue-400',
  busy:    'bg-yellow-500',
  dnd:     'bg-red-500',
  stream:  'bg-purple-500',
  offline: 'bg-muted-foreground',
};

export function PresenceBadge({ presence, className }: PresenceBadgeProps) {
  const { t } = useTranslation();
  const style = PRESENCE_STYLES[presence.status] ?? PRESENCE_STYLES.offline;
  const dot   = DOT_COLORS[presence.status]   ?? DOT_COLORS.offline;

  return (
    <Badge variant="outline" className={cn('gap-1.5 text-xs font-medium', style, className)}>
      <span className={cn('h-2 w-2 rounded-full shrink-0', dot)} />
      {presence.text ?? t(`presence.${presence.status}`)}
    </Badge>
  );
}
