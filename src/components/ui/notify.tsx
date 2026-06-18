'use client';

import { toast } from 'sonner';

export type NotificationType = 'neutral' | 'success' | 'danger';

interface NotifyOptions {
  /** Notification type — only changes border color. Default: 'neutral'. */
  type?: NotificationType;
  /** If true, the notification stays until dismissed. Default: false. */
  persistent?: boolean;
  /** Optional action button. */
  action?: { label: string; onClick: () => void };
}

const BORDER_COLORS: Record<NotificationType, string> = {
  neutral: 'border-l-border',
  success: 'border-l-emerald-500',
  danger: 'border-l-destructive',
};

/**
 * Spawns a notification at the bottom of the screen.
 *
 * @example
 * notify('World saved', { type: 'success' })
 * notify('Something went wrong', { type: 'danger', persistent: true })
 * notify('A new version is available', { action: { label: 'Update', onClick: () => {} } })
 */
export function notify(message: string, options: NotifyOptions = {}) {
  const { type = 'neutral', persistent = false, action } = options;

  toast(message, {
    duration: persistent ? Infinity : 4000,
    dismissible: true,
    cancel: action
      ? { label: action.label, onClick: action.onClick }
      : undefined,
    classNames: {
      toast: `!border-l-4 ${BORDER_COLORS[type]}`,
    },
  });
}
