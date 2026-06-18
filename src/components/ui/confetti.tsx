'use client';

import confetti from 'canvas-confetti';
import { useCallback, useImperativeHandle, useRef, forwardRef } from 'react';
import type { ReactNode } from 'react';

export interface ConfettiRef {
  /** Fire confetti from the given coordinates (or center of the trigger element if omitted). */
  fire: (x?: number, y?: number) => void;
}

interface ConfettiProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wrapper that fires confetti from its element on demand via ref.
 * Call `ref.current.fire(x, y)` to trigger.
 */
export const Confetti = forwardRef<ConfettiRef, ConfettiProps>(
  function Confetti({ children, className }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);

    const fire = useCallback((x?: number, y?: number) => {
      const el = containerRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const originY = y !== undefined ? y / window.innerHeight : (rect.top + rect.height / 2) / window.innerHeight;

      // Spread bursts across the full width, with angled sides
      const bursts = [
        { originX: (rect.left + rect.width * 0.1) / window.innerWidth, angle: 110 },
        { originX: (rect.left + rect.width * 0.3) / window.innerWidth, angle: 95 },
        { originX: (rect.left + rect.width * 0.5) / window.innerWidth, angle: 90 },
        { originX: (rect.left + rect.width * 0.7) / window.innerWidth, angle: 85 },
        { originX: (rect.left + rect.width * 0.9) / window.innerWidth, angle: 70 },
      ];

      const shared = {
        particleCount: 6,
        spread: 25,
        startVelocity: 15,
        gravity: 0.3,
        scalar: 0.6,
        origin: { y: originY },
        colors: ['#666699', '#CCCCFF', '#a78bfa', '#c4b5fd', '#7c3aed', '#ddd6fe', '#818cf8', '#e0e7ff'],
        disableForReducedMotion: true,
      } as const;

      for (const { originX, angle } of bursts) {
        confetti({
          ...shared,
          angle,
          origin: { x: originX, y: originY },
        });
      }
    }, []);

    useImperativeHandle(ref, () => ({ fire }), [fire]);

    return (
      <div ref={containerRef} className={className}>
        {children}
      </div>
    );
  },
);
