'use client';

import { useTheme } from 'next-themes';

/**
 * Resolves the correct instance icon URL based on the current theme.
 * - If icon is a plain string, returns it as-is.
 * - If icon is a Record, picks `dark` key in dark mode, `default` otherwise.
 *   Falls back to the first available value if the preferred key is missing.
 * - Returns null if no icon is set.
 */
export function useInstanceIcon(icon: string | Record<string, string> | null | undefined): string | null {
    const { resolvedTheme } = useTheme();

    if (!icon) return null;
    if (typeof icon === 'string') return icon;

    const isDark = resolvedTheme === 'dark';
    const preferred = isDark ? 'default' : 'light';

    if (icon[preferred]) return icon[preferred];
    // fallback to any available value
    const values = Object.values(icon);
    return values[0] ?? null;
}
