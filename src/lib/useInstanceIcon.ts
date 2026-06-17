'use client';

import { useTheme } from 'next-themes';

/**
 * Resolves the correct instance icon URL from a well-known metadata.icon value.
 *
 * - `null` / `undefined` → `null`
 * - `string` → returned as-is
 * - `Record<string, string>` → dark theme prefers `light` (visible on dark bg),
 *   light theme prefers `dark`. Falls back to `default`, then first value.
 */
export function resolveInstanceIcon(
    icon: string | Record<string, string> | null | undefined,
    theme?: string | null,
): string | null {
    if (!icon) return null;
    if (typeof icon === 'string') return icon;

    const isDark = theme === 'dark';
    // dark bg → need light icon, light bg → need dark icon
    const preferred = isDark ? 'light' : 'dark';

    return icon[preferred] ?? icon['default'] ?? Object.values(icon)[0] ?? null;
}

/**
 * React hook wrapper — same logic as resolveInstanceIcon, but reads the theme
 * from next-themes automatically.
 */
export function useInstanceIcon(icon: string | Record<string, string> | null | undefined): string | null {
    const { resolvedTheme } = useTheme();
    return resolveInstanceIcon(icon, resolvedTheme);
}
