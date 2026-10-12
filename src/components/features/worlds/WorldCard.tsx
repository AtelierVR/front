import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Icon } from '@iconify/react';
import { TagBadges } from '@/components/shared/TagBadges';
import { ImageDisplay } from '@/components/shared/ImageDisplay';
import type { ApiWorld } from '@/types/api';

interface WorldCardProps {
  world: ApiWorld;
}

export function WorldCard({ world }: WorldCardProps) {
  const { t } = useTranslation();
  const href = `/w/${world.server ? `${world.id}@${world.server}` : world.id}`;

  return (
    <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
      <Card className="overflow-hidden hover:border-primary/50 transition-colors">
        <div className="aspect-video w-full overflow-hidden bg-muted">
          <ImageDisplay
            source={world.images}
            ratio={16 / 9}
            alt={world.title}
            sizes="(max-width: 768px) 50vw, 320px"
            fallback={<span className="text-muted-foreground text-xs">{t('common.unknown')}</span>}
          />
        </div>
        <CardContent className="py-3 px-4">
          <p className="font-semibold text-sm truncate">{world.title}</p>
          {world.description && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{world.description}</p>
          )}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Icon icon="material-symbols:group-rounded" className="h-3 w-3" />
              {world.capacity}
            </div>
            <TagBadges tags={world.tags} limit={2} className="justify-end" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
