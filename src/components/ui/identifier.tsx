'use client';

import { useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useApi } from '@/lib/api/context';
import { NoxIdentifier, type NoxIdString } from '@/types/nox-identifier';
import { Confetti, type ConfettiRef } from '@/components/ui/confetti';
import { notify } from '@/components/ui/notify';

interface IdentifierProps {
  /** The full nox identifier string (e.g. "u:42@server.com" or "42@server.com") */
  value: NoxIdString;
  className?: string;
  clickable?: boolean
}

/**
 * Displays a NoxIdentifier with click-to-copy + confetti.
 * Always shows the full `<...>@<server>` form.
 */
export function Identifier({
  value,
  className,
  clickable = true
}: IdentifierProps) {
  const { wellKnown } = useApi();
  const localAddress = wellKnown?.address ?? '::';
  const confettiRef = useRef<ConfettiRef>(null);

  const parsed = NoxIdentifier.parse(value);

  const display = parsed.type
    ? `${parsed.type}:${parsed.id}@${parsed.server ?? localAddress}`
    : `${parsed.id}@${parsed.server ?? localAddress}`;

  const copyValue = parsed.toString(localAddress);

  const copy = useCallback(async (e: React.MouseEvent) => {
    try {
      await navigator.clipboard.writeText(copyValue);
      confettiRef.current?.fire(e.clientX, e.clientY);
      notify('Copied!', { type: 'success' });
    } catch {
      // clipboard may be unavailable
    }
  }, [copyValue]);

  return (
    <Confetti ref={confettiRef}>
      <button
        onClick={clickable ? copy : undefined}
        className={cn(
          'text-muted-foreground transition-colors',
          clickable && "hover:text-foreground cursor-pointer",
          className,
        )}
      >
        <span className="text-sm tabular-nums">{display}</span>
      </button>
    </Confetti>
  );
}
