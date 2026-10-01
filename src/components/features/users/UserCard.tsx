import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { AvatarWithPresence } from '@/components/ui/avatar-with-presence';
import { TagBadges } from '@/components/shared/TagBadges';
import type { ApiUser } from '@/types/api';

interface UserCardProps {
  user: ApiUser;
}

export function UserCard({ user }: UserCardProps) {
  return (
    <Link href={`/u/${user.username}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
      <Card className="hover:border-primary/50 transition-colors">
        <CardContent className="flex items-center gap-3 py-4">
          <AvatarWithPresence
            presence={user.presence.status}
            size="lg"
            src={user.thumbnail}
            alt={user.display}
            name={user.display ?? user.username}
            length={2}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-sm leading-tight">{user.display}</p>
            <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
          </div>
          <TagBadges tags={user.tags} limit={1} className="shrink-0" />
        </CardContent>
      </Card>
    </Link>
  );
}
