'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Debounces a value by the given delay (ms). Returns the debounced value.
 * Useful for search inputs — avoids firing API calls on every keystroke.
 */
export function useSearch<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState<T>(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setDebounced(value), delay);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [value, delay]);

  return debounced;
}
