import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { TagBadges } from '@/components/shared/TagBadges';
import type { ApiAvatar } from '@/types/api';

interface AvatarCardProps {
  avatar: ApiAvatar;
}

export function AvatarCard({ avatar }: AvatarCardProps) {
  const { t } = useTranslation();
  const href = `/a/${avatar.server ? `${avatar.id}@${avatar.server}` : avatar.id}`;

  return (
    <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
      <Card className="overflow-hidden hover:border-primary/50 transition-colors">
        {avatar.thumbnail ? (
          <div className="aspect-square w-full overflow-hidden bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatar.thumbnail}
              alt={avatar.title}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="aspect-square w-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground text-xs">{t('common.unknown')}</span>
          </div>
        )}
        <CardContent className="py-3 px-4">
          <p className="font-semibold text-sm truncate">{avatar.title}</p>
          {avatar.description && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{avatar.description}</p>
          )}
          <TagBadges tags={avatar.tags} limit={3} className="mt-2" />
        </CardContent>
      </Card>
    </Link>
  );
}
