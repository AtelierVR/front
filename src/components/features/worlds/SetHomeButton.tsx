'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useApi } from '@/lib/api/context';
import { updateCurrentUser } from '@/lib/api/users';
import { parseNoxId } from '@/types/nox-identifier';
import { useWorld } from './WorldContext';
import { useTranslation } from 'react-i18next';

export function SetHomeButton() {
  const { world } = useWorld();
  const { currentUser } = useApi();
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  if (!currentUser || !world) return null;

  const home = currentUser.home ? parseNoxId(currentUser.home) : null;
  const isHome = home?.id === String(world.id) && home?.server === world.server;

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const worldSid = `${world.id}@${world.server}`;
      await updateCurrentUser({ home: isHome ? null : worldSid });
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
          className={isHome ? 'text-blue-500' : ''}
        >
          <Icon icon="material-symbols:home-rounded" className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{t(isHome ? 'world.remove_home' : 'world.set_home')}</p>
      </TooltipContent>
    </Tooltip>
  );
}
