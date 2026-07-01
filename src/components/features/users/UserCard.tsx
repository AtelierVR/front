import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { AvatarWithPresence } from '@/components/ui/avatar-with-presence';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AvatarWithPresence } from '@/components/ui/avatar-with-presence';
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
          <AvatarWithPresence
            presence={user.presence.status}
            size="lg"
            src={user.thumbnail}
            alt={user.display}
            fallback={initials}
          />
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
