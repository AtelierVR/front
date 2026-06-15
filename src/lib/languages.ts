import { getLanguages, getCountries, getSupportedLangs } from '@hotosm/iso-countries-languages';

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

export interface Language {
  code: string;
  name: string;
  /** flagcdn.com SVG URL for the primary country of this language. */
  flag: string;
}


/** Resolves a locale to a language code supported by iso-countries-languages, falling back to 'en'. */
function resolveLang(locale: string): string {
  const supported = getSupportedLangs();
  const base = locale.split('-')[0].toLowerCase();
  if (supported.includes(base)) return base;
  if (supported.includes(locale)) return locale;
  return 'en';
}

/** Lazily-loaded set of valid ISO 3166-1 alpha-2 country codes (uppercase). */
let _validCountryCodes: Set<string> | null = null;

function getValidCountryCodes(): Set<string> {
  if (_validCountryCodes) return _validCountryCodes;
  _validCountryCodes = new Set(Object.keys(getCountries('en')));
  return _validCountryCodes;
}

export class Languages {
  private static cache = new Map<string, Language[]>();

  static async get(locale?: string): Promise<Language[]> {
    const lang = resolveLang(locale || 'en');
    const cached = this.cache.get(lang);
    if (cached) return cached;

    // getLanguages(lang) → { "fr": "French", "en": "English", "ja": "Japanese", ... }
    const langs: Record<string, string> = getLanguages(lang);

    const list: Language[] = Object.entries(langs).map(([code, name]) => ({
      code: code.toLowerCase(),
      name: name.split(',')[0], // remove any parenthetical info
      flag: `https://flagcdn.com/${code}.svg`,
    }));

    const sorted = list.sort((a, b) => a.name.localeCompare(b.name));
    this.cache.set(lang, sorted);
    return sorted;
  }

  static async getById(code: string, locale?: string): Promise<Language | null> {
    const languages = await this.get(locale);
    return languages.find(l => l.code === code) || null;
  }

  static clearCache(): void {
    this.cache.clear();
  }
}