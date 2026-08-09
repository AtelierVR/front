'use client';

import { type ComponentProps } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PresenceIcon } from '@/lib/presences';
import { cn } from '@/lib/utils';
import type { ApiUserPresence } from '@/types/api';

// ── Sizes ─────────────────────────────────────────────────────────────────────

type SizeKey = 'xs' | 'sm' | 'default' | 'lg';

export const AVATAR_SIZES: Record<SizeKey, { avatar: string; dot: string; dotSize: string }> = {
  xs:      { avatar: 'size-5',      dot: 'absolute -bottom-0.5 -right-0.5', dotSize: 'h-2.5! w-2.5!' },
  sm:      { avatar: 'size-6',      dot: 'absolute -bottom-0.5 -right-0.5', dotSize: 'h-3! w-3!' },
  default: { avatar: 'size-8',      dot: 'absolute -bottom-0.5 -right-0.5', dotSize: 'h-3.5! w-3.5!' },
  lg:      { avatar: 'size-10',     dot: 'absolute -bottom-0.5 -right-0.5', dotSize: 'h-4! w-4!' },
};

// ── Props ─────────────────────────────────────────────────────────────────────

export interface AvatarWithPresenceProps {
  /** Presence status. If omitted/falsy, no presence dot is shown. */
  presence?: ApiUserPresence['status'];
  /**
   * Predefined size. Controls both the avatar and the presence dot.
   * @default "default"
   */
  size?: SizeKey;
  /** Additional classes for the outer wrapper. */
  className?: string;
  /** Additional classes for the Avatar. */
  avatarClassName?: string;
  /** Image src. */
  src?: string | null;
  /** Alt text for the image. */
  alt?: string;
  /** Fallback content (initials, icon, etc.). */
  fallback?: React.ReactNode;
  /** Children rendered inside AvatarFallback (shorthand). */
  children?: React.ReactNode;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Avatar with an optional presence dot in the bottom-right corner.
 *
 * The `size` prop controls both avatar dimensions and the presence dot,
 * using predefined ratios from {@link AVATAR_SIZES}.
 *
 * @example
 * <AvatarWithPresence presence="online" size="lg" src={user.thumbnail} alt={user.display} fallback="JD" />
 * <AvatarWithPresence presence="ojf"  size="xs" src={user.thumbnail} alt={user.display} fallback="JD" />
 */
export function AvatarWithPresence({
  presence,
  size = 'default',
  className,
  avatarClassName,
  src,
  alt,
  fallback,
  children,
}: AvatarWithPresenceProps) {
  const { avatar, dot, dotSize } = AVATAR_SIZES[size];

  // Map our SizeKey to Avatar's size prop (only sm/default/lg are valid for Avatar)
  const avatarSize = (size === 'xs' ? 'sm' : size) as ComponentProps<typeof Avatar>['size'];

  return (
    <div className={cn('relative shrink-0', className)}>
      <Avatar size={avatarSize} className={cn(avatar, avatarClassName)}>
        {src && <AvatarImage src={src} alt={alt ?? ''} />}
        <AvatarFallback>{fallback ?? children}</AvatarFallback>
      </Avatar>
      {presence && (
        <PresenceIcon
          id={presence}
          className={dot}
          svgClassName={cn(dotSize, "size-1")}
        />
      )}
    </div>
  );
}
