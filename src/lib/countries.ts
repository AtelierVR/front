import { getCountries, getSupportedLangs } from '@hotosm/iso-countries-languages';

export interface Country {
  id: string;
  name: string;
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

export class Countries {
  private static cache = new Map<string, Country[]>();

  static async get(locale?: string): Promise<Country[]> {
    const lang = resolveLang(locale || 'en');
    const cached = this.cache.get(lang);
    if (cached) return cached;

    // getCountries(lang) → { "FR": "France", "GB": "Royaume-Uni", ... }
    const countries: Record<string, string> = getCountries(lang);

    const list: Country[] = Object.entries(countries).map(([code, name]) => ({
      id: code.toLowerCase(),
      name,
      flag: `https://flagcdn.com/${code.toLowerCase()}.svg`,
    }));

    list.unshift({
      id: 'xx',
      name: 'No country',
      flag: 'https://flagcdn.com/xx.svg',
    });

    const sorted = list.sort((a, b) => a.name.localeCompare(b.name));
    this.cache.set(lang, sorted);
    return sorted;
  }

  static async getById(iso: string, locale?: string): Promise<Country | null> {
    const countries = await this.get(locale);
    return countries.find(c => c.id === iso.toLowerCase()) || null;
  }

  static clearCache(): void {
    this.cache.clear();
  }
}