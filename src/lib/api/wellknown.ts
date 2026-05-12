import type { NoxWellKnown } from '@/types/wellknown';

let cached: NoxWellKnown | null = null;

export async function fetchWellKnown(): Promise<NoxWellKnown | null> {
  if (cached) return cached;

  const baseUrl = process.env.NEXT_PUBLIC_WELLKNOWN ?? '/.well-known/nox';
  try {
    const res = await fetch(baseUrl, { cache: 'no-store' });
    if (!res.ok) return null;
    const data: NoxWellKnown = await res.json();
    cached = data;
    return data;
  } catch {
    return null;
  }
}

/** Return the locally-cached server address (e.g. "hactazia.fr"), or null if not yet loaded. */
export function getWellKnownAddress(): string | null {
  return cached?.address ?? null;
}

/** Reset the module-level cache (used in tests or after server config changes). */
export function clearWellKnownCache(): void {
  cached = null;
}
