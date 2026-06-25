'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { useApi } from '@/lib/api/context';
import { useWs } from '@/lib/ws/context';
import { cn } from '@/lib/utils';

export function StatusBanner() {
  const { wellKnown } = useApi();
  const { connected: wsConnected } = useWs();
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);
  const [ready, setReady] = useState(false);
  const wasEverConnected = useRef(false);

  useEffect(() => {
    const id = setTimeout(() => setReady(true), 5000);
    return () => clearTimeout(id);
  }, []);

  // Track whether the WS has ever been connected (to avoid false red on initial load)
  useEffect(() => {
    if (wsConnected) wasEverConnected.current = true;
  }, [wsConnected]);

  // Red: API unreachable OR was connected and now disconnected
  const isOffline = wellKnown === null || (!wsConnected && wasEverConnected.current);
  const isDegraded = wellKnown !== null && wellKnown.status !== 'online';

  if (!ready || dismissed || (!isOffline && !isDegraded)) return null;

  const message = isOffline
    ? t('errors.offline')
    : wellKnown?.maintenance ?? t('errors.offline');

  return (
    <div
      role="alert"
      className={cn(
        'flex items-center justify-between gap-3 px-4 py-2 text-sm font-medium',
        isOffline
          ? 'bg-destructive text-white'
          : 'bg-yellow-500 text-yellow-950',
      )}
    >
      <div className="flex items-center gap-2">
        <Icon icon="material-symbols:wifi-off-rounded" className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{message}</span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="rounded p-0.5 opacity-80 hover:opacity-100"
      >
        <Icon icon="material-symbols:close-rounded" className="h-4 w-4" />
      </button>
    </div>
  );
}
