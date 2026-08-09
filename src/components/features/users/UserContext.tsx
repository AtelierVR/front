'use client';

import React, { createContext, useContext, useEffect } from 'react';
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

/**
 * Module-level ref tracking the last server-confirmed `out` relation
 * for the currently viewed user profile. Shared between UserProvider
 * (WS event handler) and FollowAddButton/FollowRemoveButton so that
 * optimistic button updates don't double-count with WS deltas.
 */
let _confirmedOut: string | null = null;
export function _setConfirmedOut(v: string | null) { _confirmedOut = v; }
export function _getConfirmedOut() { return _confirmedOut; }

interface UserProviderProps {
  value: UserContextValue;
  children: React.ReactNode;
}

export function UserProvider({ value, children }: UserProviderProps) {
  const { currentUser } = useApi();

  useEffect(() => {
    _confirmedOut = value.user?.relations?.out ?? null;
  }, [value.user?.id, value.user?.relations?.out]);

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

      const prevOut = _confirmedOut;
      _confirmedOut = e.out;
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
