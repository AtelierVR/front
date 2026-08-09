'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { notFound } from 'next/navigation';
import { getUser } from '@/lib/api/users';
import { useApi } from '@/lib/api/context';
import { entityStore } from '@/lib/cache/store';
import type { ApiUser } from '@/types/api';
import { UserContext } from '@/components/features/users/UserContext';
import { UserLayoutSkeleton } from '@/components/features/users/UserLayoutSkeleton';
import { UserLayoutError } from '@/components/features/users/UserLayoutError';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const { currentUser, wellKnown } = useApi();

  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!wellKnown) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    getUser(id)
      .then((u) => {
        if (!cancelled) {
          entityStore.put(`user:${u.username}@${u.server}`, u);
          setUser(u);
        }
      })
      .catch(() => { if (!cancelled) setError('User not found'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [id, wellKnown]);

  // Sync cache updates (e.g. from WS user:update) into local state
  useEffect(() => {
    if (!user) return;
    const key = `user:${user.username}@${user.server}`;
    return entityStore.subscribe(key, () => {
      const cached = entityStore.get<ApiUser>(key);
      if (cached) setUser(cached);
    });
  }, [user?.username]);

  const isSame = !!(currentUser && user
    && currentUser.id === user.id
    && currentUser.server === user.server);

  if (loading) return <UserLayoutSkeleton />;
  if (error) return <UserLayoutError message={error} />;
  if (!user) notFound();

  return (
    <UserContext.Provider value={{ user, setUser, isSame }}>
      {children}
    </UserContext.Provider>
  );
}
