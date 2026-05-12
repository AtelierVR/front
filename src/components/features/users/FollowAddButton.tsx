'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { followUser } from '@/lib/api/users';
import type { ApiUser } from '@/types/api';

interface Props {
  user: ApiUser;
  setUser: React.Dispatch<React.SetStateAction<ApiUser | null>>;
}

export function FollowAddButton({ user, setUser }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  async function send() {
    setLoading(true);
    try {
      const res = await followUser(user.id);
      setUser((u) => u ? { ...u, relations: { ...u.relations, out: res.type, in: u.relations?.in ?? null } } : u);
    } catch {
      // no-op
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" disabled={loading} onClick={send}>
      {loading ? <Icon icon="material-symbols:progress-activity" className="size-4 animate-spin" /> : <Icon icon="material-symbols:person-add-rounded" className="size-4" />}
      {t('user.follow')}
    </Button>
  );
}
