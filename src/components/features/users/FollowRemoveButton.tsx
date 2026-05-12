'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { unfollowUser } from '@/lib/api/users';
import type { ApiUser } from '@/types/api';

interface Props {
  user: ApiUser;
  type: string; // 'FOLLOW' | 'REQUEST'
  setUser: React.Dispatch<React.SetStateAction<ApiUser | null>>;
}

export function FollowRemoveButton({ user, type, setUser }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  async function send() {
    setLoading(true);
    try {
      await unfollowUser(user.id);
      setUser((u) => u ? { ...u, relations: { ...u.relations, out: null, in: u.relations?.in ?? null } } : u);
    } catch {
      // no-op
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" disabled={loading} onClick={send}>
      {loading ? (
        <Icon icon="material-symbols:progress-activity" className="size-4 animate-spin" />
      ) : type === 'REQUEST' ? (
        <Icon icon="material-symbols:schedule-rounded" className="size-4" />
      ) : (
        <Icon icon="material-symbols:person-remove-rounded" className="size-4" />
      )}
      {type === 'REQUEST' ? 'Pending' : t('user.unfollow')}
    </Button>
  );
}
