/**
 * Extracts the region code usable for flag lookup from a potentially
 * composite region identifier (e.g. "eu-west-1" → "eu").
 */
export function formatRegionFlag(region: string): string {
  return region.split('-')[0].toLowerCase();
}

/**
 * Returns a flag SVG URL for a region using flagcdn.com (free, no auth).
 * Composite regions like "eu-west-1" are automatically shortened to "eu".
 */
export async function localeFlagUrl(cca: string): Promise<string | null> {
  if (!cca) return null;
  const code = formatRegionFlag(cca);
  return `https://flagcdn.com/${code}.svg`;
}
