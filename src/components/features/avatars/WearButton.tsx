'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useApi } from '@/lib/api/context';
import { updateCurrentUser } from '@/lib/api/users';
import { parseNoxId } from '@/types/nox-identifier';
import { useAvatar } from './AvatarContext';
import { useTranslation } from 'react-i18next';

export function WearButton() {
  const { avatar } = useAvatar();
  const { currentUser } = useApi();
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  if (!currentUser || !avatar) return null;

  const worn = currentUser.avatar ? parseNoxId(currentUser.avatar) : null;
  const isWorn = worn?.id === String(avatar.id) && worn?.server === avatar.server;

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const avatarSid = `${avatar.id}@${avatar.server}`;
      await updateCurrentUser({ avatar: isWorn ? null : avatarSid });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger className="inline-flex">
        <Button
          variant="ghost"
          onClick={toggle}
          disabled={busy}
          className={isWorn ? 'text-blue-500' : ''}
        >
          <Icon icon="material-symbols:person-rounded" className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{t(isWorn ? 'avatar.remove_wear' : 'avatar.wear')}</p>
      </TooltipContent>
    </Tooltip>
  );
}
