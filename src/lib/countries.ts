import { getCountries, getSupportedLangs } from '@hotosm/iso-countries-languages';

export interface Country {
  cca2: string;
  name: { common: string };
  flags: { svg: string };
}

/** Resolves a locale to a language code supported by iso-countries-languages, falling back to 'en'. */
function resolveLang(locale: string): string {
  const supported = getSupportedLangs();
  const base = locale.split('-')[0].toLowerCase();
  if (supported.includes(base)) return base;
  if (supported.includes(locale)) return locale;
  return 'en';
}

class CountriesService {
  private cache = new Map<string, Country[]>();

  async get(locale?: string): Promise<Country[]> {
    const lang = resolveLang(locale || 'en');
    const cached = this.cache.get(lang);
    if (cached) return cached;

    // getCountries(lang) → { "FR": "France", "GB": "Royaume-Uni", ... }
    const countries: Record<string, string> = getCountries(lang);

    const list: Country[] = Object.entries(countries).map(([code, name]) => ({
      cca2: code,
      name: { common: name },
      flags: { svg: `https://flagcdn.com/${code.toLowerCase()}.svg` },
    }));

    const sorted = list.sort((a, b) => a.name.common.localeCompare(b.name.common));
    this.cache.set(lang, sorted);
    return sorted;
  }

  async getById(cca2: string, locale?: string): Promise<Country | null> {
    const countries = await this.get(locale);
    return countries.find(c => c.cca2.toUpperCase() === cca2.toUpperCase()) || null;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const countriesService = new CountriesService();