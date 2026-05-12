import type { NoxLocalizedString } from '@/types/wellknown';

/**
 * Resolves a NoxLocalizedString to a plain string for a given locale.
 *
 * Resolution order:
 *   1. Exact locale match (e.g. 'fr-CA')
 *   2. Language prefix match (e.g. 'fr')
 *   3. English fallback ('en')
 *   4. First available value
 *   5. Empty string
 */
export function resolveLocalized(
  value: NoxLocalizedString | null | undefined,
  locale: string,
): string {
  if (!value) return '';
  if (typeof value === 'string') return value;

  const lang = locale.split('-')[0];

  return (
    value[locale] ??
    value[lang] ??
    value['en'] ??
    Object.values(value)[0] ??
    ''
  );
}
