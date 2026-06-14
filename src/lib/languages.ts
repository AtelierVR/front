/**
 * Returns a flag image URL for a locale using flagcdn.com (free, no auth).
 * The `cca` field in each locale JSON must be a CCA2 code (e.g. "fr", "gb").
 */
export async function localeFlagUrl(cca: string): Promise<string | null> {
  if (!cca) return null;
  return `https://flagcdn.com/w40/${cca.toLowerCase()}.png`;
}
