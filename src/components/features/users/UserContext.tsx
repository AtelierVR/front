'use client';

import React, { createContext, useContext, useRef } from 'react';
import type { ApiUser, ApiUserRelations } from '@/types/api';
import { useWsEvent } from '@/lib/ws/context';
import { useApi } from '@/lib/api/context';

interface UserContextValue {
  user: ApiUser | null;
  setUser: React.Dispatch<React.SetStateAction<ApiUser | null>>;
  isSame: boolean;
}

export const UserContext = createContext<UserContextValue>({
  user: null,
  setUser: () => { },
  isSame: false,
});

interface UserProviderProps {
  value: UserContextValue;
  children: React.ReactNode;
}

export function UserProvider({ value, children }: UserProviderProps) {
  const { currentUser } = useApi();
  // Tracks the last server-confirmed `out` relation to compute counter deltas
  // without double-counting with optimistic button updates.
  const confirmedOutRef = useRef<string | null>(null);

  React.useEffect(() => {
    confirmedOutRef.current = value.user?.relations?.out ?? null;
  }, [value.user?.id]);

  useWsEvent('user:relation', (data: unknown) => {
    const e = data as { user: string; in: string | null; out: string | null };
    const user = value.user;
    if (!user || !currentUser) return;
    if (e.user !== `${user.id}@${user.server}`) return;

    value.setUser(u => {
      if (!u) return u;
      const rels = { ...(u.relations ?? { out: null, in: null }) } as ApiUserRelations;
      let followersDelta = 0;
      let followingDelta = 0;

      const prevOut = confirmedOutRef.current;
      confirmedOutRef.current = e.out;
      if (prevOut !== 'follow' && e.out === 'follow') followersDelta = 1;
      if (prevOut === 'follow' && e.out !== 'follow') followersDelta = -1;
      rels.out = e.out;

      const prevIn = u.relations?.in ?? null;
      if (prevIn !== 'follow' && e.in === 'follow') followingDelta = 1;
      if (prevIn === 'follow' && e.in !== 'follow') followingDelta = -1;
      rels.in = e.in;

      return {
        ...u,
        relations: rels,
        followers: u.followers + followersDelta,
        following: u.following + followingDelta,
      };
    });
  });

  useWsEvent('user:presence', (data: unknown) => {
    const e = data as { user: string; status: string; text: string | null; locations: string[] | null };
    const user = value.user;
    if (!user) return;
    if (e.user !== `${user.id}@${user.server}`) return;

    value.setUser(u => {
      if (!u) return u;
      return {
        ...u,
        presence: {
          status: e.status as typeof u.presence.status,
          text: e.text,
          locations: e.locations !== null
            ? e.locations
            : u.presence?.locations ?? null
        },
      };
    });
  });

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}
