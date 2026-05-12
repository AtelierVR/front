import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DOT_COLORS } from '@/components/features/users/PresenceBadge';
import type { ApiUser } from '@/types/api';

interface UserCardProps {
  user: ApiUser;
}

export function UserCard({ user }: UserCardProps) {
  const { t } = useTranslation();

  const initials = (user.display ?? user.username).slice(0, 2).toUpperCase();

  return (
    <Link href={`/u/${user.username}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
      <Card className="hover:border-primary/50 transition-colors">
        <CardContent className="flex items-center gap-3 py-4">
          <div className="relative shrink-0">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.thumbnail ?? undefined} alt={user.display} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <span
              className={cn('absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background', DOT_COLORS[user.presence.status] ?? DOT_COLORS.offline)}
              title={t(`presence.${user.presence.status}`)}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-sm leading-tight">{user.display}</p>
            <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
          </div>
          {user.tags.slice(0, 1).map((tag) => (
            <Badge key={tag} variant="secondary" className="shrink-0 text-xs">
              {tag}
            </Badge>
          ))}
        </CardContent>
      </Card>
    </Link>
  );
}
