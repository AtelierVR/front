'use client';

import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { useApi } from '@/lib/api/context';
import { useWorld } from './WorldContext';
import { useTranslation } from 'react-i18next';
import { getMyTable, setMyTable } from '@/lib/api/tables';

const TABLE_KEY = 'public.favorite.world.0';
const TABLE_MIME = 'application/json+favorite';

export function FavoriteButton() {
  const { world } = useWorld();
  const { currentUser } = useApi();
  const { t } = useTranslation();
  const [values, setValues] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await getMyTable(TABLE_KEY);
    setValues(Array.isArray(res?.data?.values) ? res!.data.values : []);
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    load();
  }, [currentUser, load]);

  if (!currentUser || !world) return null;

  const worldSid = `${world.id}@${world.server}`;
  const isFavorited = values.includes(worldSid);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    const next = isFavorited
      ? values.filter((v) => v !== worldSid)
      : [...values, worldSid];
    setValues(next);
    await setMyTable(TABLE_KEY, { values: next }, TABLE_MIME);
    setBusy(false);
  };

  return (
    <Button
      variant="ghost"
      onClick={toggle}
      disabled={busy}
      className={isFavorited ? 'text-yellow-500' : ''}
      title={t(isFavorited ? 'world.unfavorite' : 'world.favorite')}
    >
      <Icon
        icon={isFavorited ? 'material-symbols:star-rounded' : 'material-symbols:star-outline-rounded'}
        className={`size-4 ${isFavorited ? 'text-yellow-500' : ''}`}
      />
    </Button>
  );
}

