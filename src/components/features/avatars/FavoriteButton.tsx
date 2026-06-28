'use client';

import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useApi } from '@/lib/api/context';
import { useAvatar } from './AvatarContext';
import { useTranslation } from 'react-i18next';
import { getMyTable, setMyTable } from '@/lib/api/tables';
import { NoxIdentifier } from '@/types/nox-identifier';

const TABLE_KEY = 'public.favorites.avatars.0';
const TABLE_MIME = 'application/json+favorite';

export function FavoriteButton() {
  const { avatar } = useAvatar();
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

  if (!currentUser || !avatar) return null;

  const noxId = new NoxIdentifier('a', avatar.id.toString(), avatar.server);
  const noxIdStr = noxId.toString();
  const isFavorited = values.some((v) => noxId.match(v));

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    const next = isFavorited
      ? values.filter((v) => !noxId.match(v))
      : [...values, noxIdStr];
    setValues(next);
    await setMyTable(TABLE_KEY, { values: next }, TABLE_MIME);
    setBusy(false);
  };

  return (
    <Tooltip>
      <TooltipTrigger className="inline-flex">
        <Button
          variant="ghost"
          onClick={toggle}
          disabled={busy}
          className={isFavorited ? 'text-yellow-500' : ''}
        >
          <Icon
            icon={isFavorited ? 'material-symbols:star-rounded' : 'material-symbols:star-outline-rounded'}
            className="size-4"
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{t(isFavorited ? 'avatar.unfavorite' : 'avatar.favorite')}</p>
      </TooltipContent>
    </Tooltip>
  );
}
