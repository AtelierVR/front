'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { unfollowUser, getAlias } from '@/lib/api';
import { notify } from '@/components/ui/notify';
import type { ApiUser } from '@/types/api';
import { _setConfirmedOut } from './UserContext';

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
      const identifier = getAlias(user.alias, 'iid') ?? String(user.id);
      await unfollowUser(identifier);
      _setConfirmedOut(null);
      setUser((u) => {
        if (!u) return u;
        // WS event may have already updated the state — skip to avoid double-count
        if (u.relations?.out === null) return u;
        return {
          ...u,
          relations: { ...u.relations, out: null, in: u.relations?.in ?? null },
          followers: type === 'follow' ? u.followers - 1 : u.followers,
        };
      });
    } catch (err: any) {
      notify(err?.message ?? t('user.unfollow_error'), { type: 'danger' });
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
