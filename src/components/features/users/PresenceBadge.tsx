'use client';

import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DOT_COLORS, PresenceIcon } from '@/lib/presences';
import type { ApiUserPresence } from '@/types/api';

interface PresenceBadgeProps {
  presence: ApiUserPresence;
  className?: string;
}

const PRESENCE_STYLES: Record<ApiUserPresence["status"], string> = {
  oja:     'bg-cyan-500/15 text-cyan-600 border-cyan-500/30 dark:text-cyan-400',
  ojf:     'bg-blue-500/15 text-blue-600 border-blue-500/30 dark:text-blue-400',
  online:  'bg-green-500/15 text-green-600 border-green-500/30 dark:text-green-400',
  busy:    'bg-orange-500/15 text-orange-700 border-orange-500/30 dark:text-orange-400',
  dnd:     'bg-red-500/15 text-red-600 border-red-500/30 dark:text-red-400',
  stream:  'bg-violet-500/15 text-violet-600 border-violet-500/30 dark:text-violet-400',
  offline: 'bg-muted text-muted-foreground border-border',
};

// DOT_COLORS re-exported from @/lib/presences for backward compatibility
export { DOT_COLORS };

export function PresenceBadge({ presence, className }: PresenceBadgeProps) {
  const { t } = useTranslation();
  const style = PRESENCE_STYLES[presence.status] ?? PRESENCE_STYLES.offline;

  return (
    <Badge variant="outline" className={cn('gap-1.5 text-xs font-medium', style, className)}>
      <PresenceIcon id={presence.status} svgClassName="h-2! w-2! shrink-0" />
      {presence.text ?? t(`presence.${presence.status}`)}
    </Badge>
  );
}
