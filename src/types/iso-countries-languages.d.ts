declare module '@hotosm/iso-countries-languages' {
  export function getSupportedLangs(): string[];
  export function getCountries(lang: string): Record<string, string>;
  export function getCountry(lang: string, isoCode: string): string;
  export function getLanguages(lang: string): Record<string, string>;
  export function getLanguage(lang: string, isoCode: string): string;
}
