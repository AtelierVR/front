import { cn } from '@/lib/utils';
import type { ApiUserPresence } from '@/types/api';

/** Presence status string, as exposed by the API (`ApiUserPresence['status']`). */
export type PresenceStatus = ApiUserPresence['status'];

// ── Location visibility (mirror of node's `users.types.ts`) ───────────────────
//
// Bit flags describing who may see `presence.locations`. Kept in sync with
// `node/src/users/users.types.ts` so both sides speak the same vocabulary; the
// server stays the source of truth — it nulls `locations` when the viewer is not
// allowed to see them.

export enum PresenceVisibility {
  NONE     = 0b00,
  FRIENDS  = 0b01, // mutual follow only
  EVERYONE = 0b10, // anyone, guests included
}

/** Who may see `presence.locations`, per status (mirror of node). */
export const PRESENCE_VISIBILITY: Record<PresenceStatus, PresenceVisibility> = {
  offline: PresenceVisibility.NONE,
  dnd:     PresenceVisibility.NONE,
  stream:  PresenceVisibility.NONE,
  busy:    PresenceVisibility.NONE,
  online:  PresenceVisibility.FRIENDS,
  event:   PresenceVisibility.EVERYONE,
  public:  PresenceVisibility.EVERYONE,
};

/** The viewer's relationship bits, used to evaluate {@link PRESENCE_VISIBILITY}. */
export interface PresenceViewer {
  /** Mutual follow (viewer follows the user AND the user follows the viewer). */
  isFriend: boolean;
}

/** Whether `visibility` grants `viewer` access to the user's locations. */
export function canSeeLocation(visibility: PresenceVisibility, viewer: PresenceViewer): boolean {
  if (visibility & PresenceVisibility.EVERYONE) return true;
  return viewer.isFriend && (visibility & PresenceVisibility.FRIENDS) !== 0;
}

// ── Color config (Tailwind-compatible) ────────────────────────────────────────

const COLOR: Record<ApiUserPresence['status'], string> = {
  offline: '#6b7280', // gray-500
  dnd:     '#ef4444', // red-500
  stream:  '#8b5cf6', // violet-500
  busy:    '#f97316', // orange-500
  online:  '#22c55e', // green-500
  event:   '#ec4899', // pink-500
  public:  '#06b6d4', // cyan-500
};

export const DOT_COLORS: Record<ApiUserPresence['status'], string> = {
  offline: 'bg-gray-500',
  dnd:     'bg-red-500',
  stream:  'bg-violet-500',
  busy:    'bg-orange-500',
  online:  'bg-green-500',
  event:   'bg-pink-500',
  public:  'bg-cyan-500',
};

// ── PresenceIcon (SVG shape per status) ───────────────────────────────────────

let _iconSeq = 0;
function nextMaskId(status: string) {
  return `presence-mask-${status}-${++_iconSeq}`;
}

export function PresenceIcon({ id, className, svgClassName }: { id: ApiUserPresence['status']; className?: string; svgClassName?: string }) {
  const fill = COLOR[id] ?? COLOR.offline;
  const maskId = nextMaskId(id);

  return (
    <span className={cn('inline-block shrink-0', className)} aria-hidden="true">
      <svg className={cn('block', svgClassName)} viewBox="0 0 24 24" fill="none">
        <mask id={maskId}>
          <circle cx="12" cy="12" r="10" fill="white" />
          {id === 'busy' && (
            <path d="M12 7v5l3 2" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          )}
          {id === 'dnd' && (
            <line x1="7" y1="12" x2="17" y2="12" stroke="black" strokeWidth="3" strokeLinecap="round" />
          )}
          {id === 'stream' && (
            <path d="M9 6l9 6-9 6V6z" fill="black" />
          )}
          {id === 'event' && (
            <path d="M12 6l1.8 3.7 4 .6-2.9 2.8.7 4L12 15.2l-3.6 1.9.7-4L6.2 10.3l4-.6L12 6z" fill="black" />
          )}
          {id === 'public' && (
            <circle cx="12" cy="12" r="3.2" fill="black" />
          )}
        </mask>
        <circle cx="12" cy="12" r="10" fill={fill} mask={`url(#${maskId})`} />
      </svg>
    </span>
  );
}

// ── PresenceItem & options list ───────────────────────────────────────────────

export interface PresenceItem {
  id: ApiUserPresence['status'];
  label_key: string;
  icon: React.ReactElement;
}

export const PRESENCE_OPTIONS: PresenceItem[] = [
  { id: 'offline', label_key: 'presence.offline', icon: <PresenceIcon id="offline" svgClassName="h-2.5! w-2.5!" /> },
  { id: 'dnd',     label_key: 'presence.dnd',     icon: <PresenceIcon id="dnd"     svgClassName="h-2.5! w-2.5!" /> },
  { id: 'stream',  label_key: 'presence.stream',  icon: <PresenceIcon id="stream"  svgClassName="h-2.5! w-2.5!" /> },
  { id: 'busy',    label_key: 'presence.busy',    icon: <PresenceIcon id="busy"    svgClassName="h-2.5! w-2.5!" /> },
  { id: 'online',  label_key: 'presence.online',  icon: <PresenceIcon id="online"  svgClassName="h-2.5! w-2.5!" /> },
  { id: 'event',   label_key: 'presence.event',   icon: <PresenceIcon id="event"   svgClassName="h-2.5! w-2.5!" /> },
  { id: 'public',  label_key: 'presence.public',  icon: <PresenceIcon id="public"  svgClassName="h-2.5! w-2.5!" /> },
];
