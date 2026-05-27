export interface Country {
  cca2: string;
  cca3: string;
  name: {
    common: string;
    official: string;
  };
  flag: string;
  flags: {
    png: string;
    svg: string;
    alt: string;
  };
  languages: Record<string, string>;
}

class CountriesService {
  private data: Country[] | null = null;
  private isFetching = false;
  private promise: Promise<Country[]> | null = null;

  async get(): Promise<Country[]> {
    if (this.data) return this.data;
    if (this.promise) return this.promise;

    this.isFetching = true;
    this.promise = fetch('https://restcountries.com/v3.1/all?fields=cca3,cca2,name,flags,flag,languages')
      .then((res) => res.json())
      .then((data: Country[]) => {
        // Add special case for no country
        const noCountry: Country = {
          cca2: 'XX',
          cca3: 'XXX',
          name: {
            common: 'No country',
            official: 'No country',
          },
          flag: '🏴',
          flags: {
            png: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"%3E%3Crect width="60" height="40" fill="%23999"%3E%3C/rect%3E%3C/svg%3E',
            svg: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"%3E%3Crect width="60" height="40" fill="%23999"%3E%3C/rect%3E%3C/svg%3E',
            alt: 'No country flag',
          },
          languages: {
            zxx: 'No linguistic content',
          },
        };

        // Sort countries alphabetically, but don't include XX in the sort
        const sortedCountries = data.sort((a, b) => a.name.common.localeCompare(b.name.common));
        this.data = [noCountry, ...sortedCountries];
        return this.data;
      })
      .finally(() => {
        this.isFetching = false;
        this.promise = null;
      });

    return this.promise;
  }

  async getByISO(iso: string): Promise<Country | null> {
    const countries = await this.get();
    return countries.find((c) =>
      c.cca3.toLowerCase() === iso.toLowerCase() ||
      c.cca2.toLowerCase() === iso.toLowerCase()
    ) || null;
  }

  clearCache(): void {
    this.data = null;
    this.promise = null;
  }
}

export const countriesService = new CountriesService();
