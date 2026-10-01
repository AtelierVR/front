'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Icon } from '@iconify/react';
import { useApi } from '@/lib/api/context';
import { useWs } from '@/lib/ws/context';

const TOAST_ID = 'nox-status-offline';

// Track whether the WS has ever been connected (to avoid false red on initial
// load). Module-level external store so no setState is called inside an effect.
// The store stays `false` until the first connection, so a re-render is only
// ever triggered once, when a first connection is established.
const everConnected = { current: false };
const listeners = new Set<() => void>();
const subscribeEverConnected = (onStoreChange: () => void) => {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
};
const getEverConnected = () => everConnected.current;
const notifyEverConnected = () => {
  if (!everConnected.current) return;
  listeners.forEach((l) => l());
};

export function StatusToast() {
  const { wellKnown } = useApi();
  const { connected: wsConnected, on: wsOn } = useWs();
  const { t } = useTranslation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setReady(true), 5000);
    return () => clearTimeout(id);
  }, []);

  // Fired once when the first connection succeeds — flips the external store.
  useEffect(
    () => wsOn('connected', () => { everConnected.current = true; notifyEverConnected(); }),
    [wsOn],
  );

  // External store: flips once and stays true, so no setState call inside an effect.
  // `getServerSnapshot` is required for SSR (otherwise Next throws
  // "Missing getServerSnapshot ... Will revert to client rendering" and the page
  // renders as a 404). The server never has a connection yet, so it returns false.
  const wasEverConnected = useSyncExternalStore(
    subscribeEverConnected,
    getEverConnected,
    getEverConnected,
  );

  // Offline: API unreachable OR was connected and now disconnected
  const isOffline = wellKnown === null || (!wsConnected && wasEverConnected);
  const isDegraded = wellKnown !== null && wellKnown.status !== 'online';

  // Show a persistent toast as long as the server is unreachable / degraded.
  // It is un-dismissible (persistent : true) and auto-clears when back online.
  useEffect(() => {
    if (!ready) return;

    const message = isOffline
      ? t('errors.offline')
      : wellKnown?.maintenance ?? t('footer.status.degraded');

    if (isOffline || isDegraded) {
      if (document.getElementById(TOAST_ID)) return;
      toast(message, {
        id: TOAST_ID,
        duration: Infinity,
        dismissible: false,
        closeButton: false,
        className: 'nox-status-toast',
        icon: (
          <Icon
            icon="material-symbols:wifi-off-rounded"
            className="size-4 shrink-0"
            aria-hidden="true"
          />
        ),
      });
    } else {
      toast.dismiss(TOAST_ID);
    }
  }, [ready, isOffline, isDegraded, wellKnown, t]);

  return null;
}
