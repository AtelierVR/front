import { cn } from '@/lib/utils';
import type { ApiUserPresence } from '@/types/api';

// ── Color config (Tailwind-compatible) ────────────────────────────────────────

const COLOR: Record<ApiUserPresence['status'], string> = {
  oja:     '#06b6d4', // cyan-500
  ojf:     '#3b82f6', // blue-500
  online:  '#22c55e', // green-500
  busy:    '#f97316', // orange-500
  dnd:     '#ef4444', // red-500
  stream:  '#8b5cf6', // violet-500
  offline: '#6b7280', // gray-500
};

export const DOT_COLORS: Record<ApiUserPresence['status'], string> = {
  oja:     'bg-cyan-500',
  ojf:     'bg-blue-500',
  online:  'bg-green-500',
  busy:    'bg-orange-500',
  dnd:     'bg-red-500',
  stream:  'bg-violet-500',
  offline: 'bg-gray-500',
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
          {id === 'oja' && (
            <path d="M5 9l7 6 7-6" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          )}
          {id === 'ojf' && (
            <path d="M7 12.5l3 3 7-7" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          )}
          {id === 'busy' && (
            <path d="M12 7v5l3 2" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          )}
          {id === 'dnd' && (
            <line x1="7" y1="12" x2="17" y2="12" stroke="black" strokeWidth="3" strokeLinecap="round" />
          )}
          {id === 'stream' && (
            <path d="M9 6l9 6-9 6V6z" fill="black" />
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
  { id: 'oja',     label_key: 'presence.oja',     icon: <PresenceIcon id="oja"     svgClassName="h-2.5! w-2.5!" /> },
  { id: 'ojf',     label_key: 'presence.ojf',     icon: <PresenceIcon id="ojf"     svgClassName="h-2.5! w-2.5!" /> },
  { id: 'online',  label_key: 'presence.online',  icon: <PresenceIcon id="online"  svgClassName="h-2.5! w-2.5!" /> },
  { id: 'busy',    label_key: 'presence.busy',    icon: <PresenceIcon id="busy"    svgClassName="h-2.5! w-2.5!" /> },
  { id: 'dnd',     label_key: 'presence.dnd',     icon: <PresenceIcon id="dnd"     svgClassName="h-2.5! w-2.5!" /> },
  { id: 'stream',  label_key: 'presence.stream',  icon: <PresenceIcon id="stream"  svgClassName="h-2.5! w-2.5!" /> },
  { id: 'offline', label_key: 'presence.offline', icon: <PresenceIcon id="offline" svgClassName="h-2.5! w-2.5!" /> },
];
