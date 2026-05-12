import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@iconify/react';
import type { ApiWorld } from '@/types/api';
import { parseNoxId } from '@/types/nox-identifier';

interface WorldCardProps {
  world: ApiWorld;
}

export function WorldCard({ world }: WorldCardProps) {
  const { t } = useTranslation();
  const parsed = parseNoxId(String(world.id));
  const href = `/w/${world.server ? `${world.id}@${world.server}` : world.id}`;

  return (
    <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
      <Card className="overflow-hidden hover:border-primary/50 transition-colors">
        {world.thumbnail && (
          <div className="aspect-video w-full overflow-hidden bg-muted">
            {/* Use next/image in production; plain img avoids domain config here */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={world.thumbnail}
              alt={world.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}
        {!world.thumbnail && (
          <div className="aspect-video w-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground text-xs">{t('common.unknown')}</span>
          </div>
        )}
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
            <div className="flex gap-1 flex-wrap justify-end">
              {world.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
