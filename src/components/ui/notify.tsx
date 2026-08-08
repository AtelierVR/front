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
  neutral: 'border-border',
  success: 'border-emerald-500',
  danger: 'border-destructive',
};

const ICONS: Record<NotificationType, string> = {
  neutral: 'material-symbols:circle-notifications-rounded',
  success: 'material-symbols:check-circle-rounded',
  danger: 'material-symbols:error-rounded',
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
    icon: (
      <svg
        className="size-4 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        {type === 'success' && (<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></>)}
        {type === 'danger' && (
          <>
            <circle cx="12" cy="12" r="10" />
            <path d="m15 9-6 6" />
            <path d="m9 9 6 6" />
          </>
        )}
        {type === 'neutral' && (
          <>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </>
        )}
      </svg>
    ),
  });
}
